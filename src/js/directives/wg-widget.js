(function () {
  angular.module('widgetGrid').controller('wgWidgetController', ['$scope', '$compile', 'Widget', function($scope, $compile) {    
    this.innerCompile = function (element) {
      $compile(element)($scope);
    };
  }]);
  
  angular.module('widgetGrid').directive('wgWidget', ['Widget', function (Widget) {
    return {
      scope: {
        top: '=',
        left: '=',
        width: '=',
        height: '=',
        editable: '@?'
      },
      restrict: 'AE',
      controller: 'wgWidgetController',
      require: '^wgGrid',
      transclude: true,
      templateUrl: 'wg-widget',
      replace: true,
      link: function (scope, element, attrs, gridCtrl) {
        var widgetOptions = {
            top: scope.top,
            left: scope.left,
            width: scope.width,
            height: scope.height
        };
        var widget = new Widget(widgetOptions);
        
        scope.editable = 'false';
        scope.widget = widget;
        
        scope.getNodeIndex = function () {
          var index = 0, elem = element[0];
          while ((elem = elem.previousElementSibling) !== null) { ++index; }
          return index;
        };
        
        scope.setWidgetPosition = function (position) {
          widget.setPosition(position);
          var newposition  = widget.getPosition();
          scope.top = newposition.top;
          scope.left = newposition.left;
          scope.width = newposition.width;
          scope.height = newposition.height;
          gridCtrl.updateWidget(widget);
          element.css(gridCtrl.getWidgetStyle(widget));
        };
        
        scope.$on('wg-finished-rendering', function () {
          element.css(gridCtrl.getWidgetStyle(widget));
        });
        
        scope.$on('$destroy', function () {
          gridCtrl.removeWidget(widget);
        });
        
        gridCtrl.addWidget(widget);
      }
    };
  }]);
})();
