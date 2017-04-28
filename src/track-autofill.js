(function() {
  var debugging = /debugtrackautofilljs/i.test(window.location.href);
  var autofillOnPageLoadTimeWindow = 1000;
  var trackingAutofillGlobally = false;

  var ATTRS = {
    TRACK_AUTOFILL: 'data-track-autofill',
    TRIGGERED_ON_PAGE_LOAD: 'data-track-autofill-change-triggered-on-page-load',
    ORIGINAL_VALUE: 'data-track-autofill-original-value',
    CHECKING: 'data-track-autofill-checking',
    ABORT: 'data-track-autofill-abort'
  };

  var CHECK_DELAY = 1000;

  var debug = function(txt, obj) {
    if (debugging) {
      console.log('{ track-autofill.js debugging : }')
      console.log(txt);
      if (obj) {
        console.log(obj);
      }
      console.log('\n\n');
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

  var oldValueOf = function($el) {
    var val = $el.attr(ATTRS.ORIGINAL_VALUE);
    if (typeof val !== typeof undefined && val !== false) {
      return val;
    }
    return /text|password/.test($el.attr('type')) || $el.is('select') || $el.is('textarea') ? '' : 'false';
  };

  var newValueOf = function($el) {
    if (/text|password/.test($el.attr('type')) || $el.is('select') || $el.is('textarea')) {
      var val = $el.val();
      if (typeof val !== 'string') {
        return '';
      }
      return val;
    }
    return $el.is('checked') + '';
  };

  var checkAndTrigger = function($els, cb) {
    $els.each(function() {
      var oldValue = oldValueOf($(this));
      var newValue = newValueOf($(this));

      debug('[PLUGIN] checking:', $(this)[0]);
      debug('[PLUGIN] old value = ' + oldValue);
      debug('[PLUGIN] new value = ' + newValue);
      
      // if the value of this element hac changed..
      if (newValue !== oldValue) {
        var abort = $(this).attr(ATTRS.ABORT);
        abort = typeof abort !== typeof undefined && abort !== false;

        // and if the browser hasn't already triggered a 'change' event as a result..
        if (!abort) {
          debug('[PLUGIN] "change" will be triggered by plugin for:', $(this)[0]);

          // trigger a 'change' event
          $(this).attr(ATTRS.ORIGINAL_VALUE, newValue).trigger('change');
        } else {
          debug('[PLUGIN] will abort - "change" on element below already triggered by browser:', $(this)[0]);
        }

        $(this).removeAttr(ATTRS.CHECKING).removeAttr(ATTRS.ABORT);
      } else {
        debug('[PLUGIN] no autofill detected for:', $(this)[0]);
      }
    });
  };
  
  // if a 'change' event is triggered by the browser..
  document.onchange = function (e) {

    // while the browser is autofilling after a new page load..
    if (autofillOnPageLoadTimeWindow > 0) {
      var changed = e.target;

      // mark that 'changed' input accordingly
      changed.setAttribute(ATTRS.TRIGGERED_ON_PAGE_LOAD, true);
      debug('[ON PAGE LOAD] browser triggered change for:', changed);
    }
  };

  // as soon as the page loads..
  document.addEventListener("DOMContentLoaded", function() {

    // open up a time window allowing the browser some time to autofill
    setTimeout(function() {
      autofillOnPageLoadTimeWindow = 0;
      debug('[ON PAGE LOAD] autofill time window = 0');
    }, autofillOnPageLoadTimeWindow);
  });

  $.fn.trackAutofill = function() {
    var $this = this;
    $this.attr(ATTRS.TRACK_AUTOFILL, true);
    
    waitForBrowserToAutofillOnPageLoad(function() {
      var alreadyTriggeredOnPageLoad = $this.attr(ATTRS.TRIGGERED_ON_PAGE_LOAD);
      alreadyTriggeredOnPageLoad = typeof alreadyTriggeredOnPageLoad !== typeof undefined && alreadyTriggeredOnPageLoad !== false;

      // if the browser did not trigger an autofill-change event for this element on page load..
      if (!alreadyTriggeredOnPageLoad) {
        debug('[PLUGIN] will check whether element below was autofilled on page load:', $this[0]);

        // check whether this element was autofilled on page load and trigger a change event accordingly
        checkAndTrigger($this);
      } else {
        $this.attr(ATTRS.ORIGINAL_VALUE, newValueOf($this));
        debug('[PLUGIN] change already triggered on page load for:', $this[0]);
      }
      
      // if a 'change' event is triggered on this element.. 
      $this.on('change', function(e) {      
 
        // if this 'change' was triggered by the browser..
        if (!e.isTrigger) {
          var currentlyBeingChecked = $this.attr(ATTRS.CHECKING);
          currentlyBeingChecked = typeof currentlyBeingChecked !== typeof undefined && currentlyBeingChecked !== false;

          $this.attr(ATTRS.ORIGINAL_VALUE, newValueOf($this));
          
          // and if this element is currently being checked by the plugin..
          if (currentlyBeingChecked) {
            debug('[PLUGIN] change triggered by browser on element below while element was being checked by plugin:', $this[0]);

            // abort the check
            $this.attr(ATTRS.ABORT, true);
          }
        }
      });

      /** 
      * initialize global autofill tracking only once 
      * regardless of how many times $.trackAutofill() is called
      */
      if (!trackingAutofillGlobally) {
        trackingAutofillGlobally = true;

        // everytime an element on the page is changed..
        $(document).on('change', function(e) {

          // prevent 'focusout' event bubbling..
          e.preventDefault();

          // and if the event is NOT triggered by the browser..
          if (e.isTrigger) {
            return;
          }

          // check whether that element is part of a form that contains plugin-tracked elements..
          var $blurred = $(e.target);
          var $tracked = $blurred.closest('form').find('['+ATTRS.TRACK_AUTOFILL+']').not($blurred);
          
          // mark these elements as curretly being checked..
          $tracked.attr(ATTRS.CHECKING, true);

          // give some time to the browser to autofill those elements..
          delayedCheck = setTimeout(function() {
            debug('[GLOBAL] will check elements below for autofill:', $tracked);

            // then check whether any of those elements were indeed autofilled
            checkAndTrigger($tracked);
          }, CHECK_DELAY);     
        });
      }
    });
  };
})();