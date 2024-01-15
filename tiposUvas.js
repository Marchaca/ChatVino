document.querySelector('.next').addEventListener('click', function() {
    document.querySelector('.carousel-container').style.transform = 'translateX(-100%)';
  });
  
  document.querySelector('.prev').addEventListener('click', function() {
    document.querySelector('.carousel-container').style.transform = 'translateX(0)';
  });