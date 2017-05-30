# track-autofill

## What does it do?
This jQuery plugin will track any browser autofills on the following types of elements :

- input
- select
- textarea

If an autofill is detected on any of the above elements, the plugin will wait (currently set at 1000ms) for the browser to trigger the relevant "change" event. If the browser fails to trigger such an event, the plugin will trigger one instead.

The plugin will check for an autofill as soon as the page loads as well as everytime the user interacts with the form that contains the plugin-activated element.

## How do I use it?
- In order to start tracking an element do : `$('#some-element').trackAutofill();`
- You can also start tracking an array of elements, e.g. `$('.track-me').trackAutofill();`
- Lastly, you can simply add the `[data-track-autofill]` attribute to an element, e.g. `<input data-track-autofill/>`, and the element will get auto-activated, as long as the element already exists in the DOM before `<script src="track-autofill.js"></script>`.

## How do I test it?
Download and open up [tests.html](https://github.com/Pixelik/track-autofill/blob/master/tests.html) in your browser to test.

## Debugging
Edit the script by setting `DEBUGGING` to `false` [here](https://github.com/Pixelik/track-autofill/blob/master/src/track-autofill.js#L2) and open up your browser console to start getting a detailed log. Make sure you set `DEBUGGING` to `true` in production.

## Chrome Bug
Due to [a bug in Chrome](http://stackoverflow.com/questions/35049555/chrome-autofill-autocomplete-no-value-for-password), in some rare cases, a change in the value of an auto-filled password field is not immediately detectable unless the user interacts with the page in any way. In other words, even though the password field might get pre-filled by the browser, the plugin will not detect the change unless the user interacts with the page (by clicking anywhere on the page). As a result, tracking password-autofills will not work on Chrome in extremely rare occasions.
