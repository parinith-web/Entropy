document.addEventListener('DOMContentLoaded', function(){
  const form = document.querySelector('.form');
  const submit = document.querySelector('.btn.submit');
  
  if (form && submit) {
    const submitText = submit.textContent;
    const loadingText = submit.dataset.loadingText || (submitText === 'Sign Up' ? 'Creating account...' : 'Signing in...');

    form.addEventListener('submit', function(e){
      e.preventDefault();
      
      const emailInput = form.querySelector('input[type="email"]');
      const passwordInput = form.querySelector('input[type="password"]');
      const nameInput = form.querySelector('input[type="text"]');
      
      if (emailInput && !emailInput.value) return;
      if (passwordInput && !passwordInput.value) return;

      submit.disabled = true;
      submit.textContent = loadingText;

      // Premium visual confirmation loop
      setTimeout(() => {
        // Save auth state
        localStorage.setItem('isAuthenticated', 'true');
        if (emailInput) {
          localStorage.setItem('userEmail', emailInput.value);
        }
        if (nameInput) {
          localStorage.setItem('userName', nameInput.value);
        } else if (emailInput) {
          // Fallback name from email
          const namePart = emailInput.value.split('@')[0];
          localStorage.setItem('userName', namePart.charAt(0).toUpperCase() + namePart.slice(1));
        }

        submit.textContent = 'Success! Redirecting...';
        submit.style.backgroundColor = '#10b981'; // Green accent
        submit.style.color = '#ffffff';

        setTimeout(() => {
          window.location.href = '/';
        }, 600);
      }, 1000);
    });
  }

  // Handle Google OAuth button mock
  const oauthBtn = document.querySelector('.btn.oauth');
  if (oauthBtn) {
    oauthBtn.addEventListener('click', function() {
      const originalContent = oauthBtn.innerHTML;
      oauthBtn.disabled = true;
      oauthBtn.innerHTML = 'Connecting to Google...';

      fetch('http://localhost:8000/api/auth/google-verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token: 'dev-token' })
      })
      .then(res => {
        if (!res.ok) throw new Error('Auth failed');
        return res.json();
      })
      .then(data => {
        if (data.status === 'success' && data.user) {
          localStorage.setItem('isAuthenticated', 'true');
          localStorage.setItem('userEmail', data.user.email);
          localStorage.setItem('userName', data.user.name);

          oauthBtn.innerHTML = 'Success! Redirecting...';
          oauthBtn.style.borderColor = '#10b981';
          oauthBtn.style.color = '#10b981';

          setTimeout(() => {
            window.location.href = '/';
          }, 600);
        } else {
          throw new Error('Invalid response');
        }
      })
      .catch(err => {
        console.error(err);
        oauthBtn.innerHTML = 'Authentication failed. Try again.';
        oauthBtn.style.borderColor = '#ef4444';
        oauthBtn.style.color = '#ef4444';
        setTimeout(() => {
          oauthBtn.disabled = false;
          oauthBtn.innerHTML = originalContent;
          oauthBtn.style.borderColor = '';
          oauthBtn.style.color = '';
        }, 2000);
      });
    });
  }
});

