$(document).ready(function () {
    $('#login-form').submit(function (e) {
        let isValid = true;

        $('.error').text('');

        let email = $('#email').val().trim();
        if (email === '') {
            $('#email').next('.error').text('Email is required.');
            isValid = false;
        } else if (!validateEmail(email)) {
            $('#email').next('.error').text('Please enter a valid email address.');
            isValid = false;
        }

        let password = $('#password').val().trim();
        if (password === '') {
            $('#password').next('.error').text('Password is required.');
            isValid = false;
        } else if (password.length < 6) {
            $('#password').next('.error').text('Password must be at least 6 characters.');
            isValid = false;
        }

        if (!isValid) {
            e.preventDefault();
        }
    });

    function validateEmail(email) {
        let regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    }
});
