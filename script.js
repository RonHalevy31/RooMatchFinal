/* ============================================================
   RooMatch - Main JavaScript Logic
   Includes: Profile Editing, Search Filtering, Validations, and Navigation
   ============================================================ */

document.addEventListener("DOMContentLoaded", function() {
const urlParams = new URLSearchParams(window.location.search);
const userIdFromUrl = urlParams.get("user_id");

if (userIdFromUrl) {
    localStorage.setItem("currentUserId", userIdFromUrl);
}

const currentUserIdForLinks = localStorage.getItem("currentUserId");

const profileLinks = document.querySelectorAll('a[href="profile.html"]');
profileLinks.forEach(function(link) {
    if (currentUserIdForLinks) {
        link.href = "profile.html?user_id=" + currentUserIdForLinks;
    }
});

const searchLinks = document.querySelectorAll('a[href="search.html"]');
searchLinks.forEach(function(link) {
    if (currentUserIdForLinks) {
        link.href = "search.html?user_id=" + currentUserIdForLinks;
    }
});

if (urlParams.get("login") === "failed") {
    alert("Email or password do not match.");
}
    // --- Navigation & Logout Logic ---
    // Redirect user to login page after logout
    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", function() {
            localStorage.removeItem("currentUserId");
            window.location.href = "login.html";
        });
    }

    // --- Forgot Password Placeholder ---
   const forgotPasswordLink = document.getElementById("forgotPasswordLink");
        if (forgotPasswordLink) {
            forgotPasswordLink.addEventListener("click", function(event) {
                event.preventDefault();

                const emailInput = document.getElementById("email");

                if (!emailInput || emailInput.value.trim() === "") {
                    alert("Please enter your email address first.");
                    return;
                }

                if (!emailInput.checkValidity()) {
                    alert("Please enter a valid email address.");
                    return;
                }

                alert("Password reset instructions were sent to your email.");
            });
        }

    // --- Profile Page Logic ---
    // --- Profile Page Logic ---
const profileForm = document.getElementById("profileForm");

if (profileForm) {
    const currentUserId = localStorage.getItem("currentUserId");
    console.log("currentUserId:", currentUserId);

    if (currentUserId) {
        fetch(`/profile/${currentUserId}`)
            .then(response => response.json())
            .then(profile => {
                document.getElementById("fullName").value = profile.full_name || "";
                if (profile.birthdate) {
                    const date = new Date(profile.birthdate);
                    date.setDate(date.getDate() + 1);

                    document.getElementById("dob").value =
                        date.toISOString().split("T")[0];
                }
                document.getElementById("gender").value = profile.gender || "";
                document.getElementById("occupation").value = profile.occupation || "";
                document.getElementById("description").value = profile.description || "";
                document.getElementById("phone").value = profile.phone || "";
                document.getElementById("location").value = profile.location || "";
                document.getElementById("budget").value = profile.budget || "";
                document.getElementById("cleanliness").value = profile.cleanliness || "";
                document.getElementById("smoking").value = profile.smoking || "";
                document.getElementById("pets").value = profile.pets || "";
            })
            .catch(error => {
                console.log("Error loading profile:", error);
            });
    }

    const editBtn = document.getElementById("editBtn");
    const saveBtn = document.getElementById("saveBtn");

    const deleteBtn = document.getElementById("deleteBtn");

    if (deleteBtn) {
        deleteBtn.addEventListener("click", function() {
            const currentUserId = localStorage.getItem("currentUserId");

            const confirmDelete = confirm("Are you sure you want to delete your account?");

            if (!confirmDelete) {
                return;
            }

            fetch(`/profile/${currentUserId}`, {
                method: "DELETE"
            })
            .then(response => {
                if (response.ok) {
                    alert("Account deleted successfully.");
                    localStorage.removeItem("currentUserId");
                    window.location.href = "/login.html";
                } else {
                    alert("Error deleting account.");
                }
            })
            .catch(error => {
                console.log("Delete error:", error);
                alert("Something went wrong.");
            });
        });
    }


        // Editable profile fields
        const editableFields = [
            "gender", "occupation", "description", "profilePic",
            "location", "budget", "cleanliness", "smoking", "pets", "phone"
        ];

        // Enable editing mode
        if (editBtn && saveBtn) {
            editBtn.addEventListener("click", function() {

                editableFields.forEach(function(fieldId) {
                    const field = document.getElementById(fieldId);
                    if (field) field.removeAttribute("disabled");
                });

                saveBtn.removeAttribute("disabled");

                editBtn.textContent = "Editing Mode...";
                editBtn.disabled = true;
            });
        }
    }

    function calculateMatchPercentage(userProfile, otherProfile) {
    let score = 0;

    // Cleanliness - 40 points
    const cleanlinessDiff = Math.abs(
        parseInt(userProfile.cleanliness) - parseInt(otherProfile.cleanliness)
    );

    if (cleanlinessDiff === 0) score += 40;
    else if (cleanlinessDiff === 1) score += 30;
    else if (cleanlinessDiff === 2) score += 20;
    else if (cleanlinessDiff === 3) score += 10;

    // Smoking - 40 points
    if (userProfile.smoking === otherProfile.smoking) {
        score += 40;
    }

    // Pets - 20 points
const userPets = userProfile.pets;
const otherPets = otherProfile.pets;

if (userPets === otherPets) {
    score += 20;
} else if (
    (userPets === "has_pets" && otherPets === "no_pets_but_ok") ||
    (userPets === "no_pets_but_ok" && otherPets === "has_pets")
) {
    score += 15;
} else if (
    (userPets === "no_pets_not_ok" && otherPets === "no_pets_but_ok") ||
    (userPets === "no_pets_but_ok" && otherPets === "no_pets_not_ok")
) {
    score += 10;
}
    return score;
}

    // --- Search Page Logic ---
    const resultsGrid = document.getElementById("resultsGrid");

if (resultsGrid) {
    fetch("/profiles")
        .then(response => response.json())
        .then(profiles => {
            resultsGrid.innerHTML = "";
            const currentUserId = localStorage.getItem("currentUserId");
            const currentUserProfile = profiles.find(profile => profile.user_id == currentUserId);
            if (!currentUserProfile) {
                resultsGrid.innerHTML = "<p>Could not load your profile.</p>";
                return;
            }

            const sortedProfiles = [];

            profiles.forEach(profile => {
                if (profile.user_id != currentUserId) {
                    const matchPercentage = calculateMatchPercentage(currentUserProfile, profile);

                    profile.matchPercentage = matchPercentage;

                    sortedProfiles.push(profile);
                }
            });

            sortedProfiles.sort(function(a, b) {
                return b.matchPercentage - a.matchPercentage;
            });

            sortedProfiles.forEach(profile => {
                const matchPercentage = profile.matchPercentage;
                const birthdate = new Date(profile.birthdate);
                const age = new Date().getFullYear() - birthdate.getFullYear();

                const description = profile.description || "Looking for a great roommate match.";
                const image = profile.profile_pic || "images/logo2.png";

                const card = document.createElement("div");
                card.className = "profile-card";

                card.setAttribute("data-age", age);
                card.setAttribute("data-gender", profile.gender);
                card.setAttribute("data-smoking", profile.smoking);
                card.setAttribute("data-pets", profile.pets);

                card.innerHTML = `
                    <div class="card-avatar">
                        <img src="${image}" alt="${profile.full_name} profile picture" class="avatar-img">
                    </div>

                    <div class="card-info">
                        <h3>${profile.full_name}, ${age}</h3>
                        <p class="match-percentage">${matchPercentage}% Match</p>
                        <p class="short-desc">"${description}"</p>
                        <p><strong>Location:</strong> ${profile.location}</p>
                        <p><strong>Budget:</strong> ₪${profile.budget}</p>
                        <p><strong>Cleanliness:</strong> ${profile.cleanliness}/5</p>
                    </div>

                    <div class="card-actions">
                        <button class="btn-secondary contact-btn">
                            Show Contact Info
                        </button>

                        <div class="contact-info hidden">
                            <p>Phone: ${profile.phone}</p>
                            <p>Email: ${profile.email}</p>
                        </div>
                    </div>
                `;

                resultsGrid.appendChild(card);
                const contactBtn = card.querySelector(".contact-btn");

                contactBtn.addEventListener("click", function() {
                const contactInfo = this.nextElementSibling;
                contactInfo.classList.toggle("hidden");

                 if (contactInfo.classList.contains("hidden")) {
                    this.textContent = "Show Contact Info";
                     this.classList.replace("btn-primary", "btn-secondary");
                 } else {
                      this.textContent = "Hide Contact Info";
                    this.classList.replace("btn-secondary", "btn-primary");
                 }
                });
            });
        })
        .catch(error => {
            console.log("Error loading profiles:", error);
            resultsGrid.innerHTML = "<p>Error loading profiles.</p>";
        });
}
    // Toggle contact information visibility
    const contactButtons = document.querySelectorAll('.contact-btn');

    contactButtons.forEach(function(button) {

        button.addEventListener('click', function() {

            const contactInfo = this.nextElementSibling;

            if (contactInfo && contactInfo.classList.contains('hidden')) {

                contactInfo.classList.remove('hidden');

                this.textContent = 'Hide Contact Info';

                this.classList.replace('btn-secondary', 'btn-primary');

            } else if (contactInfo) {

                contactInfo.classList.add('hidden');

                this.textContent = 'Show Contact Info';

                this.classList.replace('btn-primary', 'btn-secondary');
            }
        });
    });

    // Filtering profiles logic
    const applyFiltersBtn = document.getElementById('applyFiltersBtn');

    if (applyFiltersBtn) {

        applyFiltersBtn.addEventListener('click', function() {

            const minAge = parseInt(document.getElementById('filterAgeMin').value) || 0;
            const maxAge = parseInt(document.getElementById('filterAgeMax').value) || 100;

            const gender = document.getElementById('filterGender').value;
            const smoking = document.getElementById('filterSmoking').value;
            const pets = document.getElementById('filterPets').value;

            const cards = document.querySelectorAll('.profile-card');

            let foundAny = false;

            cards.forEach(card => {

                const cardAge = parseInt(card.getAttribute('data-age'));
                const cardGender = card.getAttribute('data-gender');
                const cardSmoking = card.getAttribute('data-smoking');
                const cardPets = card.getAttribute('data-pets');

                // Matching conditions
                const matchAge = cardAge >= minAge && cardAge <= maxAge;
                const matchGender = (gender === 'any' || cardGender === gender);
                const matchSmoking = (smoking === 'any' || cardSmoking === smoking);
                const matchPets = (pets === 'any' || cardPets === pets);

                // Show only matching profiles
                if (matchAge && matchGender && matchSmoking && matchPets) {

                    card.style.display = 'block';

                    foundAny = true;

                } else {

                    card.style.display = 'none';
                }
            });

            // No results message
            const noResults = document.getElementById('noResultsMsg');

            if (noResults) {
                noResults.style.display = foundAny ? 'none' : 'block';
            }
        });
    }

    // --- Form Validations & Redirection ---
    const forms = document.querySelectorAll('form');
    const signupFormDirect = document.getElementById("signupForm");

    if (signupFormDirect) {
        signupFormDirect.addEventListener("submit", function(event) {
            event.preventDefault();
            let isValid = true;

function showSignupMessage(message) {
    const signupMessage = document.getElementById("signupMessage");
    if (signupMessage) {
        signupMessage.textContent = message;
        signupMessage.style.display = "block";
    }
}

const password = document.getElementById("password");
const confirmPassword = document.getElementById("confirmPassword");
const birthdate = document.getElementById("birthdate");
const phone = document.getElementById("phone");
const budget = document.getElementById("budget");

if (password.value.length < 6) {
    showSignupMessage("Password must be at least 6 characters long.");
    isValid = false;
}

else if (password.value !== confirmPassword.value) {
    showSignupMessage("Password and confirmation password do not match.");
    isValid = false;
}

else if (birthdate && birthdate.value) {
    const today = new Date();
    const birth = new Date(birthdate.value);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }

    if (age < 18) {
        showSignupMessage("You must be at least 18 years old.");
        isValid = false;
    }
}

if (isValid && phone) {
    const phoneVal = phone.value.trim();
    const phoneRegex = /^05\d{8}$/;

    if (!phoneRegex.test(phoneVal)) {
        showSignupMessage("Phone number must be in the format 05XXXXXXXX.");
        isValid = false;
    }
}

if (isValid && budget) {
    const budgetVal = Number(budget.value);

    if (budgetVal <= 0) {
        showSignupMessage("Budget must be greater than 0.");
        isValid = false;
    }
}

if (!isValid) {
    return;
}

            const signupMessage = document.getElementById("signupMessage");
            if (signupMessage) {
                signupMessage.style.display = "none";
                signupMessage.textContent = "";
            }

            const formData = new FormData(signupFormDirect);

            fetch("/signup", {
                method: "POST",
                body: new URLSearchParams(formData)
            })
            .then(response => {
                if (response.redirected) {
                    window.location.href = response.url;
                    return;
                }

                return response.text().then(message => {
                    if (signupMessage) {
                        signupMessage.textContent = "This email is already registered. Please use another email.";
                        signupMessage.style.display = "block";
                    }
                });
            })
            .catch(error => {
                console.log("Signup error:", error);
                if (signupMessage) {
                    signupMessage.textContent = "Something went wrong. Please try again.";
                    signupMessage.style.display = "block";
                }
            });
        });
    }

    forms.forEach(function(form) {

        form.addEventListener('submit', function(event) {

            let isValid = true;

            const formId = form.id;
            if (formId === "signupForm") {
                return;
            }

            // Clear previous validation messages
            document.querySelectorAll('.error-msg').forEach(function(span) {

                span.style.display = 'none';

                span.textContent = '';
            });

            form.querySelectorAll('input, select, textarea').forEach(function(field) {
                field.classList.remove('input-error');
            });

            // Show validation error
            function showError(fieldId, message) {
                const errorSpan = document.getElementById(fieldId + "Error");
                const field = document.getElementById(fieldId);

                if (errorSpan) {
                    errorSpan.textContent = message;
                    errorSpan.style.display = 'block';
                }

                if (field) {
                    field.classList.add('input-error');
                }

                isValid = false;
            }

            // Login form redirection
            // Login form handled with fetch
// Login form is handled by the server
if (formId === 'loginForm') {
    return;
}
            // Signup & profile form validations
            if (formId === 'signupForm' || formId === 'profileForm') {

                // Budget validation
                const budget = document.getElementById('budget');

                if (budget && Number(budget.value) <= 0) {
                    showError('budget', "Please enter a valid monthly budget greater than 0.");
                }

                // Age validation
                const birthdate = document.getElementById('birthdate') || document.getElementById('dob');

                if (birthdate && birthdate.value) {

                    const birthYear = new Date(birthdate.value).getFullYear();

                    const currentYear = new Date().getFullYear();

                    if (currentYear - birthYear < 18) {

                        showError(birthdate.id, "You must be at least 18 years old.");
                    }
                }

                // Password validation
                if (formId === 'signupForm') {

                    const password = document.getElementById('password');

                    const confirmPassword = document.getElementById('confirmPassword');

                    if (password && confirmPassword) {

                        if (password.value.length < 6) {

                            showError('password', "Password must be at least 6 characters long.");
                        }

                        if (password.value !== confirmPassword.value) {

                            showError('confirmPassword', "Passwords do not match.");
                        }
                       
                    }
                }
            }

            // Phone number validation
            const phone = form.querySelector('#phone');

            if (phone) {
    const phoneVal = phone.value.trim();
    const phoneRegex = /^05\d{8}$/;

    if (!phoneRegex.test(phoneVal)) {
        showError('phone', "Phone number must be in the format 05XXXXXXXX.");
    }
}
            // Final validation result
            if (isValid) {
                if (formId === "signupForm") {
                    event.preventDefault();

                    const formData = new FormData(form);

                    fetch("/signup", {
                        method: "POST",
                        body: new URLSearchParams(formData)
                    })
                    .then(response => {
                        if (response.redirected) {
                            window.location.href = response.url;
                            return;
                        }

                        return response.text().then(message => {
                            if (message === "Email already exists") {
                                showError("email", "This email is already registered.");
                            } else {
                                alert("Something went wrong. Please try again.");
                            }
                        });
                    })
                    .catch(error => {
                        console.log("Signup error:", error);
                        alert("Something went wrong. Please try again.");
                    });

                    return;
                }

                // Profile update success
                else if (formId === "profileForm") {
    event.preventDefault();

    const currentUserId = localStorage.getItem("currentUserId");
    
    const formData = new FormData();

    formData.append("phone", document.getElementById("phone").value);
    formData.append("gender", document.getElementById("gender").value);
    formData.append("occupation", document.getElementById("occupation").value);
    formData.append("description", document.getElementById("description").value);
    formData.append("location", document.getElementById("location").value);
    formData.append("budget", document.getElementById("budget").value);
    formData.append("cleanliness", document.getElementById("cleanliness").value);
    formData.append("smoking", document.getElementById("smoking").value);
    formData.append("pets", document.getElementById("pets").value);

    const fileInput = document.getElementById("profilePic");
    if (fileInput && fileInput.files.length > 0) {
        formData.append("profilePic", fileInput.files[0]);
    }

    fetch(`/profile/${currentUserId}`, {
        method: "PUT",
        body: formData
    })
    .then(response => {
        if (response.ok) {
            alert("Profile updated successfully!");
            window.location.reload();
        } else {
            alert("Error updating profile.");
        }
    })
    .catch(error => {
        console.log("Update error:", error);
        alert("Something went wrong.");
    });

    return;
}

            } else {

                // Prevent form submission if validation fails
                event.preventDefault();
            }
        });
    });
});