$(document).ready(function() {
    $('#register-form').on('submit', function(e) {
        e.preventDefault(); 

        let isValid = true;

        $('.error').text('');

        let name = $('#name').val().trim();
        if (name === '') {
            $('#name').next('.error').text('Name is required.');
            isValid = false;
        }

        let email = $('#email').val().trim();
        let emailPattern = /^[^ ]+@[^ ]+\.[a-z]{2,3}$/;
        if (email === '') {
            $('#email').next('.error').text('Email is required.');
            isValid = false;
        } else if (!emailPattern.test(email)) {
            $('#email').next('.error').text('Enter a valid email.');
            isValid = false;
        }

        let password = $('#password').val();
        if (password.length < 6) {
            $('#password').next('.error').text('Password must be at least 6 characters.');
            isValid = false;
        }

        let confirmPassword = $('#confirm_pass').val();
        if (confirmPassword !== password) {
            $('#confirm_pass').next('.error').text('Passwords do not match.');
            isValid = false;
        }
        if (isValid) {
            this.submit();
        }
    });
});
