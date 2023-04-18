document.querySelector('form').addEventListener('submit', function(event) {
    event.preventDefault(); // prevent the form from submitting normally
  
    var userType = document.getElementById('user-type').value;
  
    if (userType === 'user') {
      window.location.href = "user.html";
    } else if (userType === 'admin') {
      window.location.href = "admin.html";
    }
  });
  