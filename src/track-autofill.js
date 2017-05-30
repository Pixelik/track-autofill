(function() {
  var DEBUGGING = false;
  var CHECK_DELAY = 1000;
  var ATTRS = {
    TRACK_AUTOFILL: 'data-track-autofill',
    TRACKING_AUTOFILL: 'data-tracking-autofill',
    TRIGGERED_ON_PAGE_LOAD: 'data-track-autofill-change-triggered-on-page-load',
    ORIGINAL_VALUE: 'data-track-autofill-original-value',
    CHECKING: 'data-track-autofill-checking',
    ABORT: 'data-track-autofill-abort'
  };

  var autofillOnPageLoadTimeWindow = 1000;
  var trackingAutofillGlobally = false;

  var debug = function(msg, obj) {
    if (DEBUGGING) {
      if (typeof msg !== "object") {
        msg = '[ TRACK-AUTOFILL ] ' + msg; 
      }
      console.log(msg);
      if (obj) {
        console.log(obj);
      }
    }
  };

  var waitForBrowserToAutofillOnPageLoad = function(cb) {
    if (autofillOnPageLoadTimeWindow > 0) {
      setTimeout(function() {
        waitForBrowserToAutofillOnPageLoad(cb);
      }, 500);
    } else {
      cb();
    }
  };

  var isText = function($el) {
    return !/radio|checkbox/.test($el.attr('type'));
  };

  var oldValueOf = function($el) {
    var val = $el.attr(ATTRS.ORIGINAL_VALUE);
    if (typeof val !== typeof undefined && val !== false) {
      return val;
    }
    return isText($el) ? '' : 'false';
  };

  var newValueOf = function($el) {
    if (isText($el)) {
      return $el.val() + '';
    }
    return $el.is('checked') + '';
  };

  var checkAndTrigger = function($els, cb) {
    $els.each(function() {
      debug('checking for autofill : ', $(this)[0]);

      var oldValue = oldValueOf($(this));
      debug('old value = ' + oldValue);

      var newValue = newValueOf($(this));
      debug('new value = ' + newValue);
      
      // if the value of this element has changed..
      if (newValue !== oldValue) {
        debug('should trigger change');

        var abort = $(this).attr(ATTRS.ABORT);
        abort = typeof abort !== typeof undefined && abort !== false;
        
        // and if the browser hasn't already triggered a 'change' event as a result..
        if (!abort) {
          // trigger a 'change' event
          $(this).attr(ATTRS.ORIGINAL_VALUE, newValue).trigger('change');
          debug('change triggered by plugin');
        } else {
          debug('change already triggered by browser - will abort');
        }

        $(this).removeAttr(ATTRS.CHECKING).removeAttr(ATTRS.ABORT);
      } else {
        debug('value not changed - no autofill detected');
      }
    });
  };
  





  // if a "change" event is triggered on an element..
  document.onchange = function (e) {
    // while the browser is autofilling on page-load
    if (autofillOnPageLoadTimeWindow > 0) {
      var changed = e.target;

      debug('"change" triggered on page load by browser for: ', changed);

      // mark that element accordingly
      changed.setAttribute(ATTRS.TRIGGERED_ON_PAGE_LOAD, true);
    }
  };

  // as soon as the page loads.. 
  document.addEventListener("DOMContentLoaded", function() {
    // create a time window allowing the browser some time to autofill
    setTimeout(function() {
      autofillOnPageLoadTimeWindow = 0;
    }, autofillOnPageLoadTimeWindow);
  });






  $.fn.trackAutofill = function() {
    this.each(function() {
      var $this = $(this);

      // prevent same element from being tracked more than once
      var alreadyBeingTracked = $(this).attr(ATTRS.TRACKING_AUTOFILL);
      alreadyBeingTracked = typeof alreadyBeingTracked !== typeof undefined && alreadyBeingTracked !== false;
      if (alreadyBeingTracked) {
        return true;
      } else {
        $this.attr(ATTRS.TRACKING_AUTOFILL, true);
      }
      
      waitForBrowserToAutofillOnPageLoad(function() {
        // if the browser did not trigger an autofill-change event for this element on page load
        var alreadyTriggeredOnPageLoad = $this.attr(ATTRS.TRIGGERED_ON_PAGE_LOAD);
        alreadyTriggeredOnPageLoad = typeof alreadyTriggeredOnPageLoad !== typeof undefined && alreadyTriggeredOnPageLoad !== false;
        if (!alreadyTriggeredOnPageLoad) {
          debug('will check whether autofilled on page load for:', $this[0]);

          // check whether this element was autofilled on page load and trigger a change event accordingly
          checkAndTrigger($this);
        } else {
          debug('autofilled on page load by browser:', $this[0]);
          debug('with value = ' + autofilledValueOnPageLoad);

          // otherwise store the value the element got on page-load
          var autofilledValueOnPageLoad = newValueOf($this);
          $this.attr(ATTRS.ORIGINAL_VALUE, autofilledValueOnPageLoad);
        }
        
        /* initialize global autofill tracking only once 
        regardless of how many times $.trackAutofill() is called */
        if (!trackingAutofillGlobally) {
          trackingAutofillGlobally = true;

          // everytime an element on the page is changed
          $(document).on('change', function(e) {
            // and if the event is triggered by the browser
            if (!e.isTrigger) {            
              var $changed = $(e.target);
              
              // if the element is being tracked by the plugin
              var tracked = $changed.attr(ATTRS.TRACKING_AUTOFILL);
              tracked = typeof tracked !== typeof undefined && tracked !== false;
              if (tracked) {
                // store its new value
                $changed.attr(ATTRS.ORIGINAL_VALUE, newValueOf($changed));

                // and if this tracked element is currently being checked by the plugin
                var currentlyBeingChecked = $changed.attr(ATTRS.CHECKING);
                currentlyBeingChecked = typeof currentlyBeingChecked !== typeof undefined && currentlyBeingChecked !== false;
                if (currentlyBeingChecked) {
                  // abort the check so that the plugin doesn't trigger a 2nd change event for the same action
                  $changed.attr(ATTRS.ABORT, true);
                }
              }

              // check whether that element is part of a form that contains elements tracked by the plugin
              var $tracked = $changed.closest('form').find('['+ATTRS.TRACKING_AUTOFILL+']').not($changed);
              
              // mark these elements as currently being checked
              $tracked.attr(ATTRS.CHECKING, true);

              // give some time to the browser to autofill those elements
              setTimeout(function() {
                // then check whether any of those elements were indeed autofilled
                checkAndTrigger($tracked);
              }, CHECK_DELAY); 
            }    
          });
        }
      });
    });

    return this;
  };





  /*
    auto-activate elements that exist in the DOM already 
    and have been marked by the dev with the appropriate attribute
  */
  $(function() {
    $('['+ATTRS.TRACK_AUTOFILL+']').trackAutofill();
  });
})();
