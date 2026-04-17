// AngularJS Application
angular.module('fakeInternshipApp', [])
  .controller('MainController', function($http, $scope) {
    const vm = this;
    
    // Initialize
    vm.currentYear = new Date().getFullYear();
    vm.isAuthenticated = false;
    vm.currentUser = null;
    vm.authToken = null;
    vm.authMode = 'login';
    vm.loading = false;
    vm.analyzing = false;
    vm.errorMessage = '';
    vm.analysisResult = null;
    vm.history = [];
    vm.historyLoading = false;

    // Login Data
    vm.loginData = {
      email: '',
      password: '',
      role: 'student'
    };

    // Register Data
    vm.registerData = {
      name: '',
      email: '',
      password: '',
      role: 'student'
    };

    // Internship Form Data
    vm.internshipData = {
      companyName: '',
      position: '',
      website: '',
      contactEmail: '',
      stipendType: 'unknown',
      requiresUpfrontPayment: false,
      requiresSensitiveDocs: false,
      jobDescription: '',
      source: ''
    };

    // Check if user is already logged in
    function initAuth() {
      const savedToken = localStorage.getItem('fi_token');
      const savedUser = localStorage.getItem('fi_user');
      
      if (savedToken && savedUser) {
        try {
          vm.authToken = savedToken;
          vm.currentUser = JSON.parse(savedUser);
          vm.isAuthenticated = true;
          
          // Load history if faculty
          if (vm.currentUser.role === 'faculty') {
            vm.loadHistory();
          }
        } catch (e) {
          console.error('Error loading saved auth:', e);
          clearAuth();
        }
      }
    }

    // Clear authentication
    function clearAuth() {
      vm.isAuthenticated = false;
      vm.currentUser = null;
      vm.authToken = null;
      localStorage.removeItem('fi_token');
      localStorage.removeItem('fi_user');
    }

    // Get auth headers for API calls
    function getAuthHeaders() {
      return {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + vm.authToken
      };
    }

    // Login function
    vm.login = function() {
      vm.loading = true;
      vm.errorMessage = '';

      $http.post('/api/auth/login', {
        email: vm.loginData.email,
        password: vm.loginData.password
      })
      .then(function(response) {
        const data = response.data;
        
        // Check if role matches
        if (data.user.role !== vm.loginData.role) {
          vm.errorMessage = `This account is registered as ${data.user.role}, not ${vm.loginData.role}.`;
          vm.loading = false;
          return;
        }

        // Save auth
        vm.authToken = data.token;
        vm.currentUser = data.user;
        vm.isAuthenticated = true;
        localStorage.setItem('fi_token', data.token);
        localStorage.setItem('fi_user', JSON.stringify(data.user));

        // Load history if faculty
        if (vm.currentUser.role === 'faculty') {
          vm.loadHistory();
        }

        // Reset form
        vm.loginData = { email: '', password: '', role: 'student' };
        vm.loading = false;
        vm.errorMessage = '';
      })
      .catch(function(error) {
        vm.loading = false;
        vm.errorMessage = error.data?.message || 'Login failed. Please check your credentials.';
      });
    };

    // Register function
    vm.register = function() {
      vm.loading = true;
      vm.errorMessage = '';

      $http.post('/api/auth/register', vm.registerData)
      .then(function(response) {
        const data = response.data;

        // Save auth
        vm.authToken = data.token;
        vm.currentUser = data.user;
        vm.isAuthenticated = true;
        localStorage.setItem('fi_token', data.token);
        localStorage.setItem('fi_user', JSON.stringify(data.user));

        // Load history if faculty
        if (vm.currentUser.role === 'faculty') {
          vm.loadHistory();
        }

        // Reset form
        vm.registerData = { name: '', email: '', password: '', role: 'student' };
        vm.loading = false;
        vm.errorMessage = '';
        alert('Registration successful! You are now logged in.');
      })
      .catch(function(error) {
        vm.loading = false;
        vm.errorMessage = error.data?.message || 'Registration failed. Please try again.';
      });
    };

    // Logout function
    vm.logout = function() {
      clearAuth();
      vm.analysisResult = null;
      vm.history = [];
      vm.authMode = 'login';
    };

    // Analyze internship
    vm.analyzeInternship = function() {
      if (!vm.isAuthenticated) {
        alert('Please login first.');
        return;
      }

      vm.analyzing = true;
      vm.errorMessage = '';

      $http.post('/api/internships/evaluate', vm.internshipData, {
        headers: getAuthHeaders()
      })
      .then(function(response) {
        vm.analysisResult = response.data.data;
        vm.analyzing = false;

        // Reload history if faculty
        if (vm.currentUser.role === 'faculty') {
          vm.loadHistory();
        }

        // Scroll to result
        setTimeout(function() {
          const resultCard = document.querySelector('.result-card');
          if (resultCard) {
            resultCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 100);
      })
      .catch(function(error) {
        vm.analyzing = false;
        vm.errorMessage = error.data?.message || 'Error analyzing internship. Please try again.';
        alert(vm.errorMessage);
      });
    };

    // Load history (faculty only)
    vm.loadHistory = function() {
      if (vm.currentUser.role !== 'faculty') {
        return;
      }

      vm.historyLoading = true;

      $http.get('/api/internships', {
        headers: getAuthHeaders()
      })
      .then(function(response) {
        vm.history = response.data.data || [];
        vm.historyLoading = false;
      })
      .catch(function(error) {
        console.error('Error loading history:', error);
        vm.historyLoading = false;
        vm.history = [];
      });
    };

    // Initialize
    initAuth();
  });
