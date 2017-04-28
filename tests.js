$('#user').change(function(e) {
	console.log('#user changed to = ' + $(this).val());
}).trackAutofill();

$('#password').change(function() {
	console.log('#password changed to ' + $(this).val());
}).trackAutofill();

$('#text-1').change(function() {
	console.log('#text-1 changed to ' + $(this).val());
}).trackAutofill();

$('#text-2').change(function() {
	console.log('#text-2 changed to ' + $(this).val());
}).trackAutofill();

$('#select').change(function() {
	console.log('#select changed to ' + $(this).val());
}).trackAutofill();

$('[type="radio"]').change(function() {
	console.log('radio changed to ' + $(this).val());
}).trackAutofill();

$('[type="checkbox"]').change(function() {
	console.log('checkbox changed to ' + $(this).val());
}).trackAutofill();