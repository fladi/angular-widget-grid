/// <reference path="../../../typings/angularjs/angular.d.ts"/>

(function () {
  angular.module('widgetGrid').directive('wgMovable', ['gridUtil', function(gridUtil) {
    return {
      restrict: 'A',
      require: 'wgWidget',
      link: {
        pre: function (scope, element, attrs, widgetCtrl) {
          // init & append template
          var templateContent = gridUtil.getTemplate('wg-movable');
          if (templateContent) {
            var template = angular.element(templateContent);
            element.append(template);
            widgetCtrl.innerCompile(template);
          }
        }
      }
    };
  }]);
  
  angular.module('widgetGrid').directive('wgMover', ['$document', 'gridUtil', function ($document, gridUtil) {
    return {
      restrict: 'A',
      require: '^wgGrid',
      link: function (scope, element, attrs, gridCtrl) {         
        element.on('mousedown touchstart', onDown);
        
        function onDown(event) {
          event.preventDefault();
         
          var widgetContainer = element[0].parentElement,
              widgetElement = angular.element(widgetContainer);

          widgetElement.addClass('wg-moving');
          
          var startPos = {}; // grid positions
          startPos.top = scope.widget.top;
          startPos.left = scope.widget.left;
          startPos.height = scope.widget.height;
          startPos.width = scope.widget.width;
          startPos.bottom = startPos.top + startPos.height - 1;
          startPos.right = startPos.left + startPos.width - 1;
          
          var startRender = {}; // pixel values
          startRender.top = widgetContainer.offsetTop;
          startRender.left = widgetContainer.offsetLeft;
          startRender.height = widgetContainer.clientHeight;
          startRender.width = widgetContainer.clientWidth;
          
          
          event.offsetX = event.offsetX || event.layerX;
          event.offsetY = event.offsetY || event.layerY;
          
          var requestedRender = { top: startRender.top, left: startRender.left };
          
          var moverOffset = {
            top: event.offsetY + element[0].offsetTop,
            left: event.offsetX + element[0].offsetLeft
          };
          
          var gridPositions = gridCtrl.getPositions();
          
          var cellHeight = (gridCtrl.grid.cellSize.height / 100) * gridPositions.height,
              cellWidth = (gridCtrl.grid.cellSize.width / 100) * gridPositions.width;
          
          $document.on('mousemove touchmove', onMove);
          $document.on('mouseup touchend touchcancel', onUp);
          
          function onMove(event) {
            event.preventDefault();
            
            if (event.touches) {
              event.clientX = event.touches[0].clientX;
              event.clientY = event.touches[0].clientY;
            }
            
            // normalize the drag position
            var dragPositionX = event.clientX - gridPositions.left,
                dragPositionY = event.clientY - gridPositions.top;
            
            requestedRender.top = Math.min(Math.max(dragPositionY - moverOffset.top, 0), gridPositions.height - 1);
            requestedRender.left = Math.min(Math.max(dragPositionX - moverOffset.left, 0), gridPositions.width - 1); 

            widgetElement.css({
              top: requestedRender.top + 'px',
              left: requestedRender.left + 'px'
            });
            // TODO: preview
          }
          
          function onUp(event) {
            event.preventDefault();
            $document.off('mousemove touchmove', onMove);
            $document.off('mouseup touchend touchcancel', onUp);

            if ((requestedRender.top % cellHeight) > cellHeight / 2) {
              requestedRender.top += Math.floor(cellHeight);
            }
            
            if ((requestedRender.left % cellWidth) > cellWidth / 2) {
              requestedRender.left += Math.floor(cellWidth);
            }
            
            var finalPos = determineFinalPos(startPos, startRender, requestedRender);

            widgetElement.removeClass('wg-moving');
            scope.setWidgetPosition(finalPos);
          }
        }
        
        function determineFinalPos(startPos, startRender, requestedRender) {
          if (startRender.top === requestedRender.top && startRender.left === requestedRender.left) {
            return startPos;
          }
          
          var movedDown = requestedRender.top >= startRender.top,
              movedRight = requestedRender.left >= startRender.left;
          
          var finalPosRequest = gridCtrl.rasterizeCoords(requestedRender.left, requestedRender.top);
          
          var path = gridUtil.getPathIterator(startPos, { top: finalPosRequest.i, left: finalPosRequest.j });
          
          while (path.hasNext()) {
            var currPos = path.next();
            
            var targetArea = {
              top: currPos.top,
              left: currPos.left,
              height: startPos.height,
              width: startPos.width
            };
            
            var areaObstructed = gridCtrl.isAreaObstructed(targetArea, startPos, movedDown, movedRight);
            if (!areaObstructed) {
              return currPos;
            }
          }
        }
      }
    };
  }]);
})();