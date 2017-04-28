(function() {
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
      var currentValue = typeIsText ? $.trim($(this).val()) : $(this).is(':checked') + '';
      var originalValue = $(this).attr(ATTRS.ORIGINAL_VALUE);
      originalValue = typeof originalValue === 'string' ? originalValue : false;
      if ((!originalValue && currentValue.length) || (originalValue && (currentValue !== originalValue))) {
        $(this)
          .attr(ATTRS.ORIGINAL_VALUE, currentValue)
          .attr(ATTRS.CHANGE_EVENT_FROM_TRACK_AUTOFILL, true)
          .trigger('change');
      }
    });
  };

  $.fn.trackAutofill = function() {
    var $this = this;

    /* 
      give some time to the browser to autofill any inputs on page load
      then check whether this input was autofilled and trigger a change event if so
    */
    $(document).on('ready', function() {
      setTimeout(function() {
        checkAndTrigger($this);
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
        var $inputChanged = $(event.currentTarget);

        /*
          check whether the event was triggered by this plugin
        */
        var changeEventFromTrackAutofill = $inputChanged.attr(ATTRS.CHANGE_EVENT_FROM_TRACK_AUTOFILL);
        changeEventFromTrackAutofill = typeof changeEventFromTrackAutofill !== typeof undefined && changeEventFromTrackAutofill !== false;

        if (changeEventFromTrackAutofill) {
          /* 
            if the event was triggered by this plugin, ignore it 
          */
          $inputChanged.removeAttr(ATTRS.CHANGE_EVENT_FROM_TRACK_AUTOFILL);
        } else {
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