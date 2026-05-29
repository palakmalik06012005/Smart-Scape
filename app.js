function go(id, page) {
    const element = document.getElementById(id);

    if (element) {
        element.addEventListener("click", function () {
            window.location.href = page;
        });
    }
}

const API_BASE ="https://smart-scape.onrender.com/api";
let currentCafeDetails = null;

async function fetchJSON(url, options = {}) {
    const response = await fetch(url, options);

    if (!response.ok) {
        let message = `Request failed with status ${response.status}`;

        try {
            const data = await response.json();
            if (data && data.message) message = data.message;
        } catch (_error) {}

        throw new Error(message);
    }

    return response.json();
}

function getSavedPlaces() {
    return JSON.parse(localStorage.getItem("savedPlaces")) || [];
}

function showToast(message) {
    const oldToast = document.querySelector(".toast");
    if (oldToast) oldToast.remove();

    const toast = document.createElement("div");
    toast.className = "toast";
    toast.innerHTML = `<i class="fa-solid fa-circle-check"></i> ${message}`;
    document.body.appendChild(toast);

    setTimeout(() => toast.classList.add("show"), 100);
    setTimeout(() => toast.remove(), 2500);
}

function savePlace(id) {
    const saved = getSavedPlaces();

    if (!saved.includes(id)) {
        saved.push(id);
        localStorage.setItem("savedPlaces", JSON.stringify(saved));
        showToast("Place saved successfully");
    } else {
        showToast("Already saved");
    }
}

function emptyState(title, text, icon = "fa-map-location-dot") {
    return `
        <div class="empty-state">
            <i class="fa-solid ${icon}"></i>
            <h3>${title}</h3>
            <p>${text}</p>
            <a href="categories.html" class="primary-btn">
                <i class="fa-solid fa-compass"></i>
                Explore Places
            </a>
        </div>
    `;
}

function placeCard(place) {
    return `
        <div class="c-card premium-place-card">

            <div class="c-img" style="background-image:url('${place.image}')">
                <div class="place-badge">
                    ${place.rating ? `⭐ ${place.rating}` : "Featured"}
                </div>
            </div>

            <div class="c-info">
                <h3>${place.name}</h3>

                ${
                    place.location
                        ? `<p class="location-line">
                            <i class="fas fa-location-dot"></i>
                            ${place.location}
                           </p>`
                        : ""
                }

                <div class="quick-tags">
                    <span><i class="fas fa-layer-group"></i> ${place.category || "Place"}</span>
                    <span><i class="fas fa-wallet"></i> ${place.budget || "Medium"}</span>
                    <span><i class="fas fa-users"></i> ${place.crowd || "Moderate"}</span>
                    <span><i class="fas fa-couch"></i> ${place.ambience || "Cozy"}</span>
                </div>
            </div>

            <div class="card-buttons">
                <button onclick="openPlace('${place.category}','${place.id}')">
                    <i class="fa-solid fa-eye"></i> View
                </button>

                <button onclick="savePlace('${place.id}')">
                    <i class="fa-solid fa-bookmark"></i> Save
                </button>
            </div>

        </div>
    `;
}

// HOME PAGE
go("exploreBtn", "categories.html");

// CATEGORY PAGE
go("cafes", "cafes.html");
go("temples", "listing.html?category=temples");
go("parks", "listing.html?category=parks");
go("malls", "listing.html?category=malls");
go("restaurants", "listing.html?category=restaurants");
go("tourist", "listing.html?category=tourist");
go("savedBtn", "saved.html");

function openPlace(category, id) {
    window.location.href = `places.html?category=${category}&id=${id}`;
}

// LISTING PAGE
if (window.location.pathname.includes("listing.html")) {
    loadListingPage();
}

async function loadListingPage() {
    const params = new URLSearchParams(window.location.search);
    const category = params.get("category");
    const container = document.getElementById("listingContainer");

    if (!container || !category) return;

    container.innerHTML = `<p class="loading-text">Loading places...</p>`;

    try {
        const places = await fetchJSON(
            `${API_BASE}/places?category=${encodeURIComponent(category)}`
        );

        if (!places.length) {
            container.innerHTML = emptyState(
                "No places found",
                "There are no places available in this category yet."
            );
            return;
        }

        container.innerHTML = places.map(placeCard).join("");
    } catch (error) {
        container.innerHTML = emptyState("Something went wrong", error.message);
    }
}

// CAFE PAGE
const cafeContainer = document.getElementById("cafeContainer");

if (cafeContainer) {
    loadCafes();

    document.getElementById("searchBar").addEventListener("input", loadCafes);
    document.getElementById("crowdFilter").addEventListener("change", loadCafes);
    document.getElementById("ambienceFilter").addEventListener("change", loadCafes);
    document.getElementById("budgetFilter").addEventListener("change", loadCafes);
}

async function loadCafes() {
    const search = document.getElementById("searchBar").value.trim();
    const crowd = document.getElementById("crowdFilter").value;
    const ambience = document.getElementById("ambienceFilter").value;
    const budget = document.getElementById("budgetFilter").value;

    const params = new URLSearchParams();

    if (search) params.set("search", search);
    if (crowd) params.set("crowd", crowd);
    if (ambience) params.set("ambience", ambience);
    if (budget) params.set("budget", budget);

    cafeContainer.innerHTML = `<p class="loading-text">Finding best cafes...</p>`;

    try {
        const cafes = await fetchJSON(`${API_BASE}/places/cafes?${params.toString()}`);
        renderCafeCards(cafes);
    } catch (error) {
        cafeContainer.innerHTML = emptyState("Unable to load cafes", error.message);
    }
}

function renderCafeCards(cafes) {
    if (!cafes.length) {
        cafeContainer.innerHTML = emptyState(
            "No cafes found",
            "Try changing your search, budget, crowd, or ambience filters.",
            "fa-mug-hot"
        );
        return;
    }

    cafeContainer.innerHTML = cafes.map(placeCard).join("");
}

// DETAILS PAGE
const detailContainer = document.getElementById("placeDetails");

if (detailContainer) {
    loadPlaceDetails();
}

async function loadPlaceDetails() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");

    if (!id) {
        detailContainer.innerHTML = emptyState("Invalid place", "Place id is missing.");
        return;
    }

    detailContainer.innerHTML = `<p class="loading-text">Loading place details...</p>`;

    try {
        const place = await fetchJSON(`${API_BASE}/places/${encodeURIComponent(id)}`);
        renderPlaceDetails(place);
    } catch (error) {
        detailContainer.innerHTML = emptyState("Unable to load place", error.message);
    }
}

function renderPlaceDetails(place) {
    if (place.category === "cafes") {
        currentCafeDetails = place;

        detailContainer.innerHTML = `
            <div class="container cafe-details">

                <h2 class="title">${place.name}</h2>

                <div class="piccolo-gallery">
                    <div class="img" style="background-image:url('${place.image}')"></div>
                </div>

                <div class="piccolo-info">

                    <div class="detail-tags">
                        <span>⭐ ${place.rating || "N/A"}</span>
                        <span>💰 ${place.budget || "Medium"}</span>
                        <span>👥 ${place.crowd || "Moderate"}</span>
                        <span>☕ ${place.ambience || "Cozy"}</span>
                    </div>

                    <p><b>Location:</b> ${place.location}</p>
                    <p><b>Timing:</b> ${place.timing || "Not available"}</p>
                    <p><b>Rating:</b> ${place.rating ?? "N/A"}</p>
                </div>

                <h3 class="sub-title">Menu Highlights</h3>

                <div class="menu-grid">
                    ${(place.menu || []).map(item => `
                        <div class="menu-item">
                            <i class="fa-solid fa-utensils"></i>
                            ${item}
                        </div>
                    `).join("")}
                </div>

                <h3 class="sub-title">Visitor Reviews</h3>

                <div class="reviews" id="reviewList"></div>

                <div class="review-section">
                    <h3>Share Your Experience</h3>

                    <textarea id="reviewBox" placeholder="Write your review here..."></textarea>

                    <button onclick="addReview('${place.id}')">
                        <i class="fa-solid fa-paper-plane"></i>
                        Add Review
                    </button>

                    <button onclick="savePlace('${place.id}')">
                        <i class="fa-solid fa-bookmark"></i>
                        Save Place
                    </button>
                </div>

                <h3 class="sub-title">Location Map</h3>

                <iframe src="https://www.google.com/maps?q=${encodeURIComponent(place.location)}&output=embed"></iframe>

            </div>
        `;

        renderReviews(place.reviews || []);
        return;
    }

    detailContainer.innerHTML = `
        <div class="container cafe-details">

            <h2 class="title">${place.name}</h2>

            <div class="gallery">
                <img src="${place.image}" alt="${place.name}">
            </div>

            <div class="piccolo-info">

                <div class="detail-tags">
                    <span>${place.category || "Place"}</span>
                    <span>⭐ ${place.rating || "Featured"}</span>
                </div>

                <h2>Description</h2>
                <p>${place.description || "No description available."}</p>

                ${
                    place.location
                        ? `<p><b>Location:</b> ${place.location}</p>`
                        : ""
                }

                <button class="primary-btn" onclick="savePlace('${place.id}')">
                    <i class="fa-solid fa-bookmark"></i>
                    Save Place
                </button>

            </div>

            <h3 class="sub-title">Location Map</h3>

            <iframe src="${place.map || `https://www.google.com/maps?q=${encodeURIComponent(place.location || place.name)}&output=embed`}"></iframe>

        </div>
    `;
}

// REVIEWS SYSTEM
async function addReview(id) {
    const box = document.getElementById("reviewBox");
    const text = box.value.trim();

    if (text === "") {
        showToast("Please write something first");
        return;
    }

    try {
        const result = await fetchJSON(
            `${API_BASE}/places/${encodeURIComponent(id)}/reviews`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ text }),
            }
        );

        box.value = "";
        currentCafeDetails.reviews = result.reviews;
        renderReviews(currentCafeDetails.reviews);

        showToast("Review added successfully");
    } catch (error) {
        showToast(error.message);
    }
}

function renderReviews(reviews) {
    const reviewList = document.getElementById("reviewList");

    if (!reviewList) return;

    if (!reviews.length) {
        reviewList.innerHTML = `
            <div class="review-card">
                <p>No reviews yet. Be the first to share your experience.</p>
            </div>
        `;
        return;
    }

    reviewList.innerHTML = reviews.map(review => `
        <div class="review-card">
            <i class="fa-solid fa-user-circle"></i>
            <p>${review.text}</p>
        </div>
    `).join("");
}

// SAVED PAGE
const savedContainer = document.getElementById("savedContainer");

if (savedContainer) {
    loadSavedPlaces();
}

async function loadSavedPlaces() {
    const saved = getSavedPlaces();
    savedContainer.innerHTML = "";

    const emptySavedState = document.getElementById("emptySavedState");

    if (saved.length === 0) {
        if (emptySavedState) emptySavedState.style.display = "block";
        return;
    }

    if (emptySavedState) emptySavedState.style.display = "none";

    savedContainer.innerHTML = `<p class="loading-text">Loading saved places...</p>`;

    const placePromises = saved.map(id =>
        fetchJSON(`${API_BASE}/places/${encodeURIComponent(id)}`).catch(() => null)
    );

    const savedPlaces = await Promise.all(placePromises);
    const validPlaces = savedPlaces.filter(Boolean);

    if (!validPlaces.length) {
        savedContainer.innerHTML = emptyState(
            "Saved places unavailable",
            "Some saved places could not be loaded right now."
        );
        return;
    }

    savedContainer.innerHTML = validPlaces.map(placeCard).join("");
}