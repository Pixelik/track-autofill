$(function() {
	$('#user').trackAutofill().change(function() {
		console.log('CHANGE EVENT => user name is ' + $(this).val());
  });
	
	$('#password').trackAutofill().change(function() {
		console.log('CHANGE EVENT => password is ' + $(this).val());
  });
});
