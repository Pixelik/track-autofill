(function() {
  var debugging = true;
  var debug = function(msg) {
    if (debugging) {
      //console.log('==== track-autofill.js | DEBUG (below) ====');
      console.log(msg);
    }
  };

  var ATTRS = {
    TRACK_AUTOFILL: 'data-track-autofill',
    ORIGINAL_VALUE: 'data-track-autofill-original-value',
    CHANGE_EVENT_FROM_TRACK_AUTOFILL: 'data-track-autofill-change-event'
  };

  var CHECK_DELAY = 1000;

  var trackingAutofillGlobally = false;

  var checkAndTrigger = function($els) {
    $els.each(function() {
      var typeIsText = ($(this).is('input') && ($(this).attr('type') === 'text')) || $(this).is('select') || $(this).is('textarea');
      debug('type is text = ' + typeIsText);

      var currentValue = typeIsText ? $.trim($(this).val()) : $(this).is(':checked') + '';
      debug('currentValue = ' + currentValue);

      var originalValue = $(this).attr(ATTRS.ORIGINAL_VALUE);
      originalValue = typeof originalValue === 'string' ? originalValue : false;
      debug('originalValue = ' + originalValue);

      if ((!originalValue && currentValue.length) || (originalValue && (currentValue !== originalValue))) {
        debug('change event will be triggered by track-autofill.js');
        $(this)
          .attr(ATTRS.ORIGINAL_VALUE, currentValue)
          .attr(ATTRS.CHANGE_EVENT_FROM_TRACK_AUTOFILL, true)
          .trigger('change');
      }
    });
  };

  $.fn.trackAutofill = function() {
    var $this = this;

    var changeEventTriggeredOnThisByBrowserOnPageLoad = false;
    var thisWasCheckedByPluginOnPageLoad = false;

    /* 
      give some time to the browser to autofill any inputs on page load
      then check whether this input was autofilled and trigger a change event if so
    */
    $(document).on('ready', function() {
      setTimeout(function() {
        if (!changeEventTriggeredOnThisByBrowserOnPageLoad) {
          thisWasCheckedByPluginOnPageLoad = true;
          debug('DOM ready will checkAndTrigger');
          checkAndTrigger($this);
        }
      }, CHECK_DELAY);
    });


    /*
      the following code will create a global event listener
      and therefore will only be executed once
      regardless of how many different elements on the page 
      get activated with this plugin
    */
    if (!trackingAutofillGlobally) {
      trackingAutofillGlobally = true;

      /* 
        whenever a change event is emmitted
      */
      $(document).on('change', function(event) {
        var $inputChanged = $(event.target);
        debug('change event captured');
        debug($inputChanged[0]);

        /*
          check whether the event was triggered by this plugin
        */
        var changeEventFromTrackAutofill = $inputChanged.attr(ATTRS.CHANGE_EVENT_FROM_TRACK_AUTOFILL);
        changeEventFromTrackAutofill = typeof changeEventFromTrackAutofill !== typeof undefined && changeEventFromTrackAutofill !== false;
        
        if ($inputChanged.is($this) && !thisWasCheckedByPluginOnPageLoad) {
          changeEventTriggeredOnThisByBrowserOnPageLoad = true;
          debug('change event triggered by browser on tracked element that hasn\'t yet been checked on pageLoad by plugin');
        } 
        
        if (changeEventFromTrackAutofill) {
          /* 
            if the event was triggered by this plugin, ignore it 
          */
          $inputChanged.removeAttr(ATTRS.CHANGE_EVENT_FROM_TRACK_AUTOFILL);
          debug('change event captured originates from track-autofill.js so it will be IGNORED');
        } else {
          debug('change event captured does not originate from track-autofill.js so other tracked elements will be now be checked');
          /*
            otherwise, find the form it originated from
          */
          var $form = $inputChanged.closest('form');

          /*
            give some time to the browser to autofill the rest of the form
            then check whether any other inputs, that were activated with this plugin, 
            were autofilled because of this user interaction
            and trigger a change event if so
          */
          setTimeout(function() {
            checkAndTrigger($form.find('[' + ATTRS.TRACK_AUTOFILL + ']').not($inputChanged));
          }, CHECK_DELAY);
        }
      });
    }

    return $this;
  };
})();