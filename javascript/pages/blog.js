document.addEventListener('DOMContentLoaded', function () {
  const blogCards = document.querySelectorAll('.blog-post');

  initializeSkeletonLoading();

  if (blogCards.length > 0) {
    initializeScrollEffects();
  }

  function initializeSkeletonLoading() {
    blogCards.forEach((card) => {
      card.classList.add('skeleton');
      setTimeout(() => card.classList.remove('skeleton'), 1000);
    });
  }

  function initializeScrollEffects() {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    blogCards.forEach((card) => observer.observe(card));
  }


  const dynamicStyle = document.createElement('style');
  dynamicStyle.textContent = `
    .blog-post {
      opacity: 0;
      transform: translateY(20px);
      transition: opacity 0.6s ease, transform 0.6s ease;
    }
    .blog-post.revealed {
      opacity: 1;
      transform: translateY(0);
    }
    .blog-post.skeleton {
      background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
      background-size: 200% 100%;
      animation: skeleton-loading 1.5s infinite;
    }
    @keyframes skeleton-loading {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
    /* Add/Adjust styles for images/videos within skeleton */
    .blog-post.skeleton img,
    .blog-post.skeleton iframe {
        filter: grayscale(100%); /* Make images/videos look grayed out during skeleton loading */
    }
  `;
  document.head.appendChild(dynamicStyle);
});