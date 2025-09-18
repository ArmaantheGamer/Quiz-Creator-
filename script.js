// Use a key for localStorage
const STORAGE_KEY = 'mediaQuizQuestions_CustomLevels';

// Default empty questions with custom levels
const defaultData = {
    levels: [],
    questions: {}
};

// DOM elements
const startScreen = document.getElementById('start-screen');
const quizContainer = document.getElementById('quiz-container');
const resultContainer = document.getElementById('result-container');
const questionElement = document.getElementById('question');
const optionsElement = document.getElementById('options');
const mediaContainer = document.getElementById('media-container');
const afterMediaOverlay = document.getElementById('after-media-overlay');
const afterMediaContainer = document.getElementById('after-media-container');
const closeAfterMediaBtn = document.getElementById('close-after-media');
const scoreElement = document.getElementById('score');
const finalScoreElement = document.getElementById('final-score');
const resultMessageElement = document.getElementById('result-message');
const progressElement = document.getElementById('progress');
const prevButton = document.getElementById('prev-btn');
const nextButton = document.getElementById('next-btn');
const playAgainButton = document.getElementById('play-again');
const startMessage = document.getElementById('start-message');
const adminPanel = document.getElementById('admin-panel');
const toggleAdminBtn = document.getElementById('toggle-admin');
const addQuestionBtn = document.getElementById('add-question-btn');
const resetQuestionsBtn = document.getElementById('reset-questions-btn');
const viewQuestionsBtn = document.getElementById('view-questions-btn');
const errorModal = document.getElementById('error-modal');
const modalMessage = document.getElementById('modal-message');
const modalOkBtn = document.getElementById('modal-ok-btn');
const exportBtn = document.getElementById('export-btn');
const importBtn = document.getElementById('import-btn');
const importFile = document.getElementById('import-file');
const levelButtonsContainer = document.getElementById('level-buttons');
const levelList = document.getElementById('level-list');
const levelNameInput = document.getElementById('level-name');
const levelColor1Input = document.getElementById('level-color1');
const levelColor2Input = document.getElementById('level-color2');
const addLevelBtn = document.getElementById('add-level-btn');
const levelSelect = document.getElementById('admin-difficulty');

// Quiz state
let currentLevelId = '';
let currentQuestions = [];
let currentQuestionIndex = 0;
let score = 0;
let userAnswers = [];
let quizData = {};
let questionShuffleMap = {};
let activeMediaElements = [];
let lastPlayedQuizId = ''; // Track the last played quiz

// Initialize the quiz
function initQuiz() {
    // Load questions from localStorage or use defaults
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
        quizData = JSON.parse(savedData);
    } else {
        quizData = JSON.parse(JSON.stringify(defaultData));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(quizData));
    }

    // Update UI based on questions
    updateLevelButtons();
    updateLevelSelect();
    updateLevelList();
    updateStartMessage();

    // Event listeners
    toggleAdminBtn.addEventListener('click', () => {
        if (adminPanel.style.display === 'block') {
            adminPanel.style.display = 'none';
            toggleAdminBtn.innerHTML = '<i class="fas fa-plus-circle"></i> Create your Quiz';
        } else {
            adminPanel.style.display = 'block';
            toggleAdminBtn.innerHTML = '<i class="fas fa-times"></i> Close';
        }
    });

    addQuestionBtn.addEventListener('click', addCustomQuestion);
    resetQuestionsBtn.addEventListener('click', resetQuestions);
    viewQuestionsBtn.addEventListener('click', viewQuestions);
    modalOkBtn.addEventListener('click', () => {
        errorModal.style.display = 'none';
    });
    
    // After-answer media overlay
    closeAfterMediaBtn.addEventListener('click', () => {
        // Stop any playing media
        stopAllMedia();
        afterMediaOverlay.style.display = 'none';
        if (currentQuestionIndex < currentQuestions.length - 1) {
            currentQuestionIndex++;
            showQuestion();
        } else {
            finishQuiz();
        }
    });
    
    // Export/import functionality
    exportBtn.addEventListener('click', exportQuizData);
    importBtn.addEventListener('click', () => importFile.click());
    importFile.addEventListener('change', importQuizData);
    
    // Level management
    addLevelBtn.addEventListener('click', addCustomLevel);
    
    // Media upload previews
    setupMediaUpload('display');
    setupMediaUpload('after');
    
    // Media type selector
    document.querySelectorAll('.media-type-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const type = this.getAttribute('data-type');
            const forSection = this.getAttribute('data-for');
            const container = this.parentElement;
            
            // Toggle active state
            container.querySelectorAll('.media-type-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            // Update preview visibility
            if (forSection === 'display') {
                if (type === 'image') {
                    document.getElementById('display-media-preview').style.display = 'block';
                    document.getElementById('display-video-preview').style.display = 'none';
                } else {
                    document.getElementById('display-media-preview').style.display = 'none';
                    document.getElementById('display-video-preview').style.display = 'block';
                }
            } else {
                if (type === 'image') {
                    document.getElementById('after-media-preview').style.display = 'block';
                    document.getElementById('after-video-preview').style.display = 'none';
                } else {
                    document.getElementById('after-media-preview').style.display = 'none';
                    document.getElementById('after-video-preview').style.display = 'block';
                }
            }
        });
    });
}

// Function to stop all media elements
function stopAllMedia() {
    // Stop all media elements
    document.querySelectorAll('video').forEach(video => {
        video.pause();
        video.currentTime = 0;
    });
    
    // Clear active media array
    activeMediaElements = [];
}

// Function to shuffle array (Fisher-Yates algorithm)
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function updateLevelButtons() {
    levelButtonsContainer.innerHTML = '';
    
    if (quizData.levels.length === 0) {
        levelButtonsContainer.innerHTML = '<p>No levels created yet. Use the admin panel to create levels.</p>';
        return;
    }
    
    quizData.levels.forEach(level => {
        const button = document.createElement('button');
        button.classList.add('difficulty-btn');
        button.setAttribute('data-level', level.id);
        
        // Set gradient background
        button.style.background = `linear-gradient(to bottom, ${level.color1}, ${level.color2})`;
        
        // Set text color based on brightness of first color
        const color = hexToRgb(level.color1);
        const brightness = (color.r * 299 + color.g * 587 + color.b * 114) / 1000;
        button.style.color = brightness > 125 ? '#333' : 'white';
        
        button.innerHTML = `
            <i class="fas fa-signal"></i>
            ${level.name}
        `;
        
        // Check if level has questions
        if (!quizData.questions[level.id] || quizData.questions[level.id].length === 0) {
            button.classList.add('disabled-btn');
        } else {
            button.addEventListener('click', () => {
                currentLevelId = level.id;
                lastPlayedQuizId = level.id; // Store the last played quiz
                startQuiz();
            });
        }
        
        levelButtonsContainer.appendChild(button);
    });
}

function updateLevelSelect() {
    levelSelect.innerHTML = '';
    
    if (quizData.levels.length === 0) {
        levelSelect.innerHTML = '<option value="">No levels available</option>';
        return;
    }
    
    quizData.levels.forEach(level => {
        const option = document.createElement('option');
        option.value = level.id;
        option.textContent = level.name;
        levelSelect.appendChild(option);
    });
}

function updateLevelList() {
    levelList.innerHTML = '';
    
    if (quizData.levels.length === 0) {
        levelList.innerHTML = '<p>No levels created yet</p>';
        return;
    }
    
    quizData.levels.forEach(level => {
        const levelItem = document.createElement('div');
        levelItem.classList.add('level-item');
        levelItem.style.background = `linear-gradient(to right, ${level.color1}, ${level.color2})`;
        
        const questionCount = quizData.questions[level.id] ? quizData.questions[level.id].length : 0;
        
        levelItem.innerHTML = `
            <div>
                <div>${level.name}</div>
                <small>${questionCount} question${questionCount !== 1 ? 's' : ''}</small>
            </div>
            <div class="level-actions">
                <button class="level-action-btn" data-action="edit" data-level="${level.id}">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="level-action-btn" data-action="delete" data-level="${level.id}">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        
        levelList.appendChild(levelItem);
    });
    
    // Add event listeners for edit and delete buttons
    document.querySelectorAll('.level-action-btn[data-action="delete"]').forEach(btn => {
        btn.addEventListener('click', () => {
            const levelId = btn.getAttribute('data-level');
            deleteLevel(levelId);
        });
    });
    
    document.querySelectorAll('.level-action-btn[data-action="edit"]').forEach(btn => {
        btn.addEventListener('click', () => {
            const levelId = btn.getAttribute('data-level');
            editLevel(levelId);
        });
    });
}

function updateStartMessage() {
    const totalQuestions = Object.values(quizData.questions).reduce((acc, curr) => acc + curr.length, 0);
    if (totalQuestions === 0) {
        startMessage.textContent = "No questions yet! Click 'Create your Quiz' to create levels and add questions.";
    } else {
        startMessage.textContent = "Select a level to start the quiz!";
    }
}

function showModal(message, type = 'error') {
    modalMessage.textContent = message;
    errorModal.style.display = 'flex';
    
    const modalTitle = document.getElementById('modal-title');
    if (modalTitle) {
        let icon = 'fa-exclamation-circle';
        let titleText = 'Error!';
        switch(type) {
            case 'success':
                icon = 'fa-check-circle';
                titleText = 'Success!';
                break;
            case 'warning':
                icon = 'fa-exclamation-triangle';
                titleText = 'Warning!';
                break;
            case 'info':
                icon = 'fa-info-circle';
                titleText = 'Info';
                break;
            default:
                icon = 'fa-exclamation-circle';
                titleText = 'Error!';
        }
        modalTitle.innerHTML = `<i class="fas ${icon}"></i> ${titleText}`;
    }
}

function setupMediaUpload(section) {
    const uploadInput = document.getElementById(`admin-${section}-media-upload`);
    const urlInput = document.getElementById(`admin-${section}-media-url`);
    const imagePreview = document.getElementById(`${section}-media-preview`);
    const videoPreview = document.getElementById(`${section}-video-preview`);
    
    uploadInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(event) {
                if (file.type.startsWith('image/')) {
                    imagePreview.src = event.target.result;
                    imagePreview.style.display = 'block';
                    videoPreview.style.display = 'none';
                    // Set active button to image
                    document.querySelector(`.media-type-btn[data-for="${section}"][data-type="image"]`).classList.add('active');
                    document.querySelector(`.media-type-btn[data-for="${section}"][data-type="video"]`).classList.remove('active');
                } else if (file.type.startsWith('video/')) {
                    videoPreview.src = event.target.result;
                    videoPreview.style.display = 'block';
                    imagePreview.style.display = 'none';
                    // Set active button to video
                    document.querySelector(`.media-type-btn[data-for="${section}"][data-type="video"]`).classList.add('active');
                    document.querySelector(`.media-type-btn[data-for="${section}"][data-type="image"]`).classList.remove('active');
                }
                urlInput.value = event.target.result;
            };
            reader.readAsDataURL(file);
        }
    });
    
    urlInput.addEventListener('input', function() {
        if (this.value) {
            if (this.value.match(/\.(mp4|webm|ogg)$/i)) {
                videoPreview.src = this.value;
                videoPreview.style.display = 'block';
                imagePreview.style.display = 'none';
                // Set active button to video
                document.querySelector(`.media-type-btn[data-for="${section}"][data-type="video"]`).classList.add('active');
                document.querySelector(`.media-type-btn[data-for="${section}"][data-type="image"]`).classList.remove('active');
            } else {
                imagePreview.src = this.value;
                imagePreview.style.display = 'block';
                videoPreview.style.display = 'none';
                // Set active button to image
                document.querySelector(`.media-type-btn[data-for="${section}"][data-type="image"]`).classList.add('active');
                document.querySelector(`.media-type-btn[data-for="${section}"][data-type="video"]`).classList.remove('active');
            }
        } else {
            // If URL is empty, hide previews
            imagePreview.style.display = 'none';
            videoPreview.style.display = 'none';
        }
    });
}

function addCustomLevel() {
    const name = levelNameInput.value.trim();
    const color1 = levelColor1Input.value;
    const color2 = levelColor2Input.value;
    
    if (!name) {
        showModal("Please enter a level name!", 'error');
        return;
    }
    
    if (quizData.levels.length >= 5) {
        showModal("You can only create up to 5 levels!", 'error');
        return;
    }
    
    // Create a simple ID for the level
    const id = name.toLowerCase().replace(/\s+/g, '-');
    
    // Check if level with this name already exists
    if (quizData.levels.some(level => level.id === id)) {
        showModal("A level with this name already exists!", 'error');
        return;
    }
    
    // Add the new level
    quizData.levels.push({
        id,
        name,
        color1,
        color2
    });
    
    // Initialize empty questions array for this level
    if (!quizData.questions[id]) {
        quizData.questions[id] = [];
    }
    
    // Save to localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(quizData));
    
    // Update UI
    updateLevelButtons();
    updateLevelSelect();
    updateLevelList();
    
    // Reset form
    levelNameInput.value = '';
    
    showModal(`Level "${name}" created successfully!`, 'success');
}

function deleteLevel(levelId) {
    if (!confirm("Are you sure you want to delete this level? All questions in this level will also be deleted.")) {
        return;
    }
    
    // Remove level from levels array
    quizData.levels = quizData.levels.filter(level => level.id !== levelId);
    
    // Remove questions for this level
    delete quizData.questions[levelId];
    
    // Save to localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(quizData));
    
    // Update UI
    updateLevelButtons();
    updateLevelSelect();
    updateLevelList();
    
    showModal("Level deleted successfully!", 'success');
}

function editLevel(levelId) {
    // For simplicity, we'll just allow deletion and recreation
    // In a more advanced version, you could implement a proper edit form
    const level = quizData.levels.find(l => l.id === levelId);
    if (level) {
        levelNameInput.value = level.name;
        levelColor1Input.value = level.color1;
        levelColor2Input.value = level.color2;
        
        // Delete the old level and create a new one when Add is clicked
        deleteLevel(levelId);
    }
}

function startQuiz() {
    // Double-check that we have questions
    if (!quizData.questions[currentLevelId] || quizData.questions[currentLevelId].length === 0) {
        showModal("No questions available for this level. Please add questions first.", 'error');
        return;
    }
    
    startScreen.style.display = 'none';
    quizContainer.style.display = 'block';
    resultContainer.style.display = 'none';
    adminPanel.style.display = 'none';
    toggleAdminBtn.innerHTML = '<i class="fas fa-plus-circle"></i> Create your Quiz';
    
    currentQuestions = quizData.questions[currentLevelId];
    currentQuestionIndex = 0;
    score = 0;
    userAnswers = new Array(currentQuestions.length).fill(null);
    
    scoreElement.textContent = score;
    
    // Set level indicator
    const currentLevel = quizData.levels.find(level => level.id === currentLevelId);
    if (currentLevel) {
        document.getElementById('level-indicator').textContent = currentLevel.name;
        document.getElementById('level-indicator').style.background = `linear-gradient(to right, ${currentLevel.color1}, ${currentLevel.color2})`;
    }
    
    showQuestion();
}

function showQuestion() {
    // Check if we have questions
    if (currentQuestions.length === 0 || currentQuestionIndex >= currentQuestions.length) {
        showModal("No questions available or invalid question index.", 'error');
        return;
    }
    
    const question = currentQuestions[currentQuestionIndex];
    questionElement.textContent = question.question;
    
    // Update progress bar
    progressElement.style.width = `${((currentQuestionIndex + 1) / currentQuestions.length) * 100}%`;
    
    // Display media
    mediaContainer.innerHTML = '';
    if (question.displayMedia && question.displayMedia.url) {
        mediaContainer.classList.remove('hidden');
        if (question.displayMedia.type === 'image') {
            const img = document.createElement('img');
            img.src = question.displayMedia.url;
            img.alt = "Question media";
            mediaContainer.appendChild(img);
        } else {
            const video = document.createElement('video');
            video.src = question.displayMedia.url;
            video.alt = "Question media";
            video.autoplay = true;
            video.loop = true;
            video.muted = true;
            video.controls = true;
            mediaContainer.appendChild(video);
            activeMediaElements.push(video);
        }
    } else {
        mediaContainer.classList.add('hidden');
    }
    
    // Display options in shuffled order
    optionsElement.innerHTML = '';
    
    // Create a unique key for this question to remember its shuffle order
    const questionKey = `${currentLevelId}_${currentQuestionIndex}`;
    
    // If we haven't shuffled this question before, do it now
    if (!questionShuffleMap[questionKey]) {
        // Create a copy of the options array and shuffle it
        const shuffledOptions = shuffleArray([...question.options]);
        questionShuffleMap[questionKey] = {
            options: shuffledOptions,
            correctIndex: shuffledOptions.indexOf(question.options[0]) // Find where the correct answer ended up
        };
    }
    
    shuffledData = questionShuffleMap[questionKey];
    
    shuffledData.options.forEach((option, index) => {
        const optionElement = document.createElement('div');
        optionElement.classList.add('option');
        if (userAnswers[currentQuestionIndex] === index) {
            optionElement.classList.add('selected');
        }
        optionElement.textContent = option;
        optionElement.addEventListener('click', () => selectOption(index, shuffledData.correctIndex));
        optionsElement.appendChild(optionElement);
    });
    
    // Update navigation buttons
    prevButton.disabled = currentQuestionIndex === 0;
    nextButton.textContent = currentQuestionIndex === currentQuestions.length - 1 ? 'Finish' : 'Next';
    nextButton.disabled = userAnswers[currentQuestionIndex] === null;
}

function selectOption(selectedIndex, correctIndex) {
    // If already answered this question, don't allow changing
    if (userAnswers[currentQuestionIndex] !== null) return;
    
    userAnswers[currentQuestionIndex] = selectedIndex;
    
    // Update visual selection
    const options = optionsElement.querySelectorAll('.option');
    options.forEach((option, index) =>{
        option.classList.remove('selected', 'correct', 'incorrect');
        if (index === selectedIndex) {
            option.classList.add('selected');
        }
    });
    
    // Check if answer is correct
    if (selectedIndex === correctIndex) {
        score++;
        scoreElement.textContent = score;
        options[selectedIndex].classList.add('correct');
    } else {
        options[selectedIndex].classList.add('incorrect');
        options[correctIndex].classList.add('correct');
    }
    
    // Stop any playing media in the question
    stopAllMedia();
    
    // Show after-answer media in fullscreen overlay
    afterMediaContainer.innerHTML = '';
    const question = currentQuestions[currentQuestionIndex];
    if (question.afterMedia && question.afterMedia.url) {
        if (question.afterMedia.type === 'image') {
            const img = document.createElement('img');
            img.src = question.afterMedia.url;
            img.alt = "Answer media";
            afterMediaContainer.appendChild(img);
        } else {
            const video = document.createElement('video');
            video.src = question.afterMedia.url;
            video.alt = "Answer media";
            video.autoplay = true;
            video.loop = true;
            video.muted = true;
            video.controls = true;
            afterMediaContainer.appendChild(video);
            activeMediaElements.push(video);
        }
        afterMediaOverlay.style.display = 'flex';
    } else {
        // If no after-answer media, proceed automatically
        if (currentQuestionIndex < currentQuestions.length - 1) {
            currentQuestionIndex++;
            showQuestion();
        } else {
            finishQuiz();
        }
    }
}

prevButton.addEventListener('click', () => {
    if (currentQuestionIndex > 0) {
        // Stop any playing media
        stopAllMedia();
        currentQuestionIndex--;
        showQuestion();
    }
});

nextButton.addEventListener('click', () => {
    if (userAnswers[currentQuestionIndex] === null) {
        showModal("Please select an answer before proceeding!", 'error');
        return;
    }
    
    // Stop any playing media
    stopAllMedia();
    
    if (currentQuestionIndex < currentQuestions.length - 1) {
        currentQuestionIndex++;
        showQuestion();
    } else {
        finishQuiz();
    }
});

function finishQuiz() {
    quizContainer.style.display = 'none';
    resultContainer.style.display = 'block';
    
    finalScoreElement.textContent = `${score}/${currentQuestions.length}`;
    
    // Generate a result message based on score
    const percentage = score / currentQuestions.length;
    let message;
    
    if (percentage === 1) {
        message = "Perfect! You're a quiz master!";
    } else if (percentage >= 0.8) {
        message = "Great job! You know your stuff!";
    } else if (percentage >= 0.6) {
        message = "Good effort! Keep practicing!";
    } else if (percentage >= 0.4) {
        message = "Not bad, but room for improvement!";
    } else {
        message = "Better luck next time!";
    }
    
    resultMessageElement.textContent = message;
    
    // Create a container for the buttons
    const buttonContainer = document.createElement('div');
    buttonContainer.style.display = 'flex';
    buttonContainer.style.flexDirection = 'column';
    buttonContainer.style.alignItems = 'center';
    buttonContainer.style.gap = '15px';
    buttonContainer.style.marginTop = '30px';
    
    // Create Play Again button
    const playAgainBtn = document.createElement('button');
    playAgainBtn.className = 'play-again';
    playAgainBtn.innerHTML = '<i class="fas fa-redo"></i> Play Again';
    playAgainBtn.addEventListener('click', () => {
        resultContainer.style.display = 'none';
        startQuiz();
    });
    
    // Create Main Menu button
    const mainMenuBtn = document.createElement('button');
    mainMenuBtn.className = 'play-again';
    mainMenuBtn.innerHTML = '<i class="fas fa-home"></i> Main Menu';
    mainMenuBtn.addEventListener('click', () => {
        resultContainer.style.display = 'none';
        startScreen.style.display = 'block';
        // Clear the shuffle map when going to main menu
        questionShuffleMap = {};
    });
    
    // Add buttons to container
    buttonContainer.appendChild(playAgainBtn);
    buttonContainer.appendChild(mainMenuBtn);
    
    // Add container to result container
    resultContainer.appendChild(buttonContainer);
}

function resetAdminForm() {
    // Reset all form fields
    document.getElementById('admin-question').value = '';
    document.getElementById('admin-option1').value = '';
    document.getElementById('admin-option2').value = '';
    document.getElementById('admin-option3').value = '';
    document.getElementById('admin-option4').value = '';
    
    // Reset media URLs
    document.getElementById('admin-display-media-url').value = '';
    document.getElementById('admin-after-media-url').value = '';
    
    // Reset file inputs
    document.getElementById('admin-display-media-upload').value = '';
    document.getElementById('admin-after-media-upload').value = '';
    
    // Reset previews
    document.getElementById('display-media-preview').style.display = 'none';
    document.getElementById('display-video-preview').style.display = 'none';
    document.getElementById('after-media-preview').style.display = 'none';
    document.getElementById('after-video-preview').style.display = 'none';
    
    // Reset media type buttons to image
    document.querySelectorAll('.media-type-btn').forEach(btn => {
        if (btn.getAttribute('data-type') === 'image') {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

function addCustomQuestion() {
    const levelId = levelSelect.value;
    const questionText = document.getElementById('admin-question').value;
    const option1 = document.getElementById('admin-option1').value;
    const option2 = document.getElementById('admin-option2').value;
    const option3 = document.getElementById('admin-option3').value;
    const option4 = document.getElementById('admin-option4').value;
    
    // Get display media type and URL
    const displayMediaType = document.querySelector('.media-type-btn[data-for="display"].active').getAttribute('data-type');
    const displayMediaUrl = document.getElementById('admin-display-media-url').value;
    
    // Get after-answer media type and URL
    const afterMediaType = document.querySelector('.media-type-btn[data-for="after"].active').getAttribute('data-type');
    const afterMediaUrl = document.getElementById('admin-after-media-url').value;

    // Validate inputs
    if (!levelId) {
        showModal("Please select a level first!", 'error');
        return;
    }
    
    if (!questionText || !option1 || !option2 || !option3 || !option4) {
        showModal("Please fill in all question and answer fields!", 'error');
        return;
    }

    // Create new question object
    const newQuestion = {
        question: questionText,
        options: [option1, option2, option3, option4],
        correct: 0,
        displayMedia: displayMediaUrl ? {
            type: displayMediaType,
            url: displayMediaUrl
        } : null,
        afterMedia: afterMediaUrl ? {
            type: afterMediaType,
            url: afterMediaUrl
        } : null
    };

    // Add to questions
    if (!quizData.questions[levelId]) {
        quizData.questions[levelId] = [];
    }
    quizData.questions[levelId].push(newQuestion);

    // Save to localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(quizData));

    // Reset the form
    resetAdminForm();

    // Update UI
    updateLevelButtons();
    updateLevelList();
    updateStartMessage();
    
    showModal(`Question added to level! The correct answer will be randomly positioned.`, 'success');
}

function resetQuestions() {
    if (confirm("Are you sure you want to reset all questions? This cannot be undone.")) {
        quizData.questions = {};
        localStorage.setItem(STORAGE_KEY, JSON.stringify(quizData));
        
        // Update UI
        updateLevelButtons();
        updateLevelList();
        updateStartMessage();
        
        showModal("All questions have been reset!", 'success');
    }
}

function viewQuestions() {
    let message = "Current Questions:\n\n";
    
    for (const levelId in quizData.questions) {
        const level = quizData.levels.find(l => l.id === levelId);
        const levelName = level ? level.name : levelId;
        
        message += `--- ${levelName.toUpperCase()} (${quizData.questions[levelId].length} questions) ---\n`;
        
        if (quizData.questions[levelId].length === 0) {
            message += "No questions yet\n\n";
        } else {
            quizData.questions[levelId].forEach((q, i) =>{
                message += `${i+1}. ${q.question}\n`;
                message += `   Correct Answer: ${q.options[0]}\n\n`;
            });
            message += "\n";
        }
    }
    
    alert(message);
}

function exportQuizData() {
    const dataStr = JSON.stringify(quizData);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = 'media-quiz-data.json';
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
}

function importQuizData(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            
            // Validate the imported data structure
            if (importedData && 
                importedData.levels !== undefined && 
                importedData.questions !== undefined) {
                
                if (confirm("Importing quiz data will replace your current data. Continue?")) {
                    quizData = importedData;
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(quizData));
                    
                    // Update UI
                    updateLevelButtons();
                    updateLevelSelect();
                    updateLevelList();
                    updateStartMessage();
                    
                    showModal("Quiz data imported successfully!", 'success');
                }
            } else {
                showModal("Invalid quiz data format. Please import a valid JSON file.", 'error');
            }
        } catch (error) {
            showModal("Error parsing JSON file. Please make sure it's a valid quiz data file.", 'error');
        }
    };
    reader.readAsText(file);
    
    // Reset the file input
    event.target.value = '';
}

// Helper function to convert hex color to RGB
function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d][2])([a-f\d][2])$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : {r: 0, g: 0, b: 0};
}

// Initialize the quiz
initQuiz();
 
