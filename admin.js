// Use a key for localStorage
const STORAGE_KEY = 'mediaQuiz_Quizzes';

// Default empty data structure
const defaultData = {
    quizzes: []
};

// DOM elements
const quizNameInput = document.getElementById('quiz-name');
const saveQuizBtn = document.getElementById('save-quiz-btn');
const levelSelect = document.getElementById('admin-difficulty');
const levelNameInput = document.getElementById('level-name');
const levelColor1Input = document.getElementById('level-color1');
const levelColor2Input = document.getElementById('level-color2');
const addLevelBtn = document.getElementById('add-level-btn');
const levelList = document.getElementById('level-list');
const addQuestionBtn = document.getElementById('add-question-btn');
const resetQuestionsBtn = document.getElementById('reset-questions-btn');
const questionsList = document.getElementById('questions-list');
const errorModal = document.getElementById('error-modal');
const modalMessage = document.getElementById('modal-message');
const modalOkBtn = document.getElementById('modal-ok-btn');

// Quiz data
let quizData = {};
let currentQuiz = null;
let currentEditingQuestion = null;
let currentEditingLevelId = null;
let currentEditingQuestionIndex = null;

// Initialize the admin panel
function initAdmin() {
    // Load quizzes from localStorage or use defaults
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
        try {
            quizData = JSON.parse(savedData);
            
            // Ensure backward compatibility with old data structure
            if (!quizData.quizzes) {
                quizData = {
                    quizzes: quizData.levels ? [{ 
                        id: 'default-quiz', 
                        name: 'My Quiz', 
                        levels: quizData.levels, 
                        questions: quizData.questions 
                    }] : []
                };
                localStorage.setItem(STORAGE_KEY, JSON.stringify(quizData));
            }
        } catch (e) {
            console.error("Error parsing saved data:", e);
            quizData = JSON.parse(JSON.stringify(defaultData));
            localStorage.setItem(STORAGE_KEY, JSON.stringify(quizData));
        }
    } else {
        quizData = JSON.parse(JSON.stringify(defaultData));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(quizData));
    }

    // Check if we're editing an existing quiz
    const urlParams = new URLSearchParams(window.location.search);
    const quizId = urlParams.get('quizId');
    
    if (quizId) {
        const quiz = quizData.quizzes.find(q => q.id === quizId);
        if (quiz) {
            currentQuiz = quiz;
            quizNameInput.value = quiz.name;
            updateLevelSelect();
            updateLevelList();
            updateQuestionsList();
        }
    }

    // Event listeners
    saveQuizBtn.addEventListener('click', saveQuiz);
    addQuestionBtn.addEventListener('click', addCustomQuestion);
    resetQuestionsBtn.addEventListener('click', resetQuestions);
    modalOkBtn.addEventListener('click', () => {
        errorModal.style.display = 'none';
    });
    
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

function saveQuiz() {
    const name = quizNameInput.value.trim();
    
    if (!name) {
        showModal("Please enter a quiz name!");
        return;
    }
    
    if (!currentQuiz) {
        // Create new quiz
        const id = name.toLowerCase().replace(/\s+/g, '-');
        
        currentQuiz = {
            id,
            name,
            levels: [],
            questions: {}
        };
        
        quizData.quizzes.push(currentQuiz);
    } else {
        // Update existing quiz
        currentQuiz.name = name;
    }
    
    // Save to localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(quizData));
    
    showModal(`Quiz "${name}" saved successfully!`);
    
    // Redirect back to main page after a short delay
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 1500);
}

function updateLevelSelect() {
    levelSelect.innerHTML = '';
    
    if (!currentQuiz || currentQuiz.levels.length === 0) {
        levelSelect.innerHTML = '<option value="">No levels available</option>';
        return;
    }
    
    currentQuiz.levels.forEach(level => {
        const option = document.createElement('option');
        option.value = level.id;
        option.textContent = level.name;
        levelSelect.appendChild(option);
    });
}

function updateLevelList() {
    levelList.innerHTML = '';
    
    if (!currentQuiz || currentQuiz.levels.length === 0) {
        levelList.innerHTML = '<p>No levels created yet</p>';
        return;
    }
    
    currentQuiz.levels.forEach((level, index) => {
        const levelItem = document.createElement('div');
        levelItem.classList.add('level-item');
        levelItem.style.background = `linear-gradient(to right, ${level.color1}, ${level.color2})`;
        
        const questionCount = currentQuiz.questions && currentQuiz.questions[level.id] ? 
            currentQuiz.questions[level.id].length : 0;
        
        levelItem.innerHTML = `
            <div>
                <div>${level.name}</div>
                <div class="level-order">Order: ${level.order}</div>
                <small>${questionCount} question${questionCount !== 1 ? 's' : ''}</small>
            </div>
            <div class="level-actions">
                <div class="level-order-controls">
                    <button class="order-btn" data-action="up" data-level="${level.id}" ${index === 0 ? 'disabled' : ''}>
                        <i class="fas fa-arrow-up"></i>
                    </button>
                    <button class="order-btn" data-action="down" data-level="${level.id}" ${index === currentQuiz.levels.length - 1 ? 'disabled' : ''}>
                        <i class="fas fa-arrow-down"></i>
                    </button>
                </div>
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
    
    // Add event listeners for order buttons
    document.querySelectorAll('.order-btn[data-action="up"]').forEach(btn => {
        btn.addEventListener('click', () => {
            const levelId = btn.getAttribute('data-level');
            moveLevelUp(levelId);
        });
    });
    
    document.querySelectorAll('.order-btn[data-action="down"]').forEach(btn => {
        btn.addEventListener('click', () => {
            const levelId = btn.getAttribute('data-level');
            moveLevelDown(levelId);
        });
    });
}

function updateQuestionsList() {
    questionsList.innerHTML = '';
    
    if (!currentQuiz) return;
    
    let hasQuestions = false;
    
    for (const level of currentQuiz.levels) {
        if (currentQuiz.questions && currentQuiz.questions[level.id] && currentQuiz.questions[level.id].length > 0) {
            hasQuestions = true;
            
            const levelHeader = document.createElement('h3');
            levelHeader.textContent = `Questions in ${level.name}`;
            questionsList.appendChild(levelHeader);
            
            currentQuiz.questions[level.id].forEach((question, index) => {
                const questionItem = document.createElement('div');
                questionItem.classList.add('question-item');
                
                questionItem.innerHTML = `
                    <div class="question-text">${question.question}</div>
                    <div class="question-options">
                        <div class="question-option correct-option">✓ ${question.options[0]}</div>
                        <div class="question-option">${question.options[1]}</div>
                        <div class="question-option">${question.options[2]}</div>
                        <div class="question-option">${question.options[3]}</div>
                    </div>
                    <div class="question-actions">
                        <button class="edit-question-btn" data-level="${level.id}" data-index="${index}">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="delete-question-btn" data-level="${level.id}" data-index="${index}">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                `;
                
                questionsList.appendChild(questionItem);
            });
        }
    }
    
    if (!hasQuestions) {
        questionsList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-question-circle"></i>
                <p>No questions added yet. Add questions using the form above.</p>
            </div>
        `;
    } else {
        // Add event listeners to edit and delete buttons
        document.querySelectorAll('.edit-question-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const levelId = btn.getAttribute('data-level');
                const index = parseInt(btn.getAttribute('data-index'));
                editQuestion(levelId, index);
            });
        });
        
        document.querySelectorAll('.delete-question-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const levelId = btn.getAttribute('data-level');
                const index = parseInt(btn.getAttribute('data-index'));
                deleteQuestion(levelId, index);
            });
        });
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
    const uploadInput = document.getElementById(`${section}-media-upload`);
    const urlInput = document.getElementById(`${section}-media-url`);
    const imagePreview = document.getElementById(`${section}-media-preview`);
    const videoPreview = document.getElementById(`${section}-video-preview`);
    
    if (!uploadInput || !urlInput) return;
    
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
    if (!currentQuiz) {
        showModal("Please create a quiz first!", 'error');
        return;
    }
    
    const name = levelNameInput.value.trim();
    const color1 = levelColor1Input.value;
    const color2 = levelColor2Input.value;
    
    if (!name) {
        showModal("Please enter a level name!", 'error');
        return;
    }
    
    // Create a simple ID for the level
    const id = `${currentQuiz.id}-${name.toLowerCase().replace(/\s+/g, '-')}`;
    
    // Check if level with this name already exists
    if (currentQuiz.levels.some(level => level.id === id)) {
        showModal("A level with this name already exists!", 'error');
        return;
    }
    
    // Determine the order (next available)
    const order = currentQuiz.levels.length > 0 ? 
        Math.max(...currentQuiz.levels.map(l => l.order)) + 1 : 1;
    
    // Add the new level
    currentQuiz.levels.push({
        id,
        name,
        color1,
        color2,
        order
    });
    
    // Initialize empty questions array for this level
    if (!currentQuiz.questions) {
        currentQuiz.questions = {};
    }
    if (!currentQuiz.questions[id]) {
        currentQuiz.questions[id] = [];
    }
    
    // Save to localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(quizData));
    
    // Update UI
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
    currentQuiz.levels = currentQuiz.levels.filter(level => level.id !== levelId);
    
    // Remove questions for this level
    if (currentQuiz.questions) {
        delete currentQuiz.questions[levelId];
    }
    
    // Reorder remaining levels
    currentQuiz.levels.forEach((level, index) => {
        level.order = index + 1;
    });
    
    // Save to localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(quizData));
    
    // Update UI
    updateLevelSelect();
    updateLevelList();
    updateQuestionsList();
    
    showModal("Level deleted successfully!", 'success');
}

function moveLevelUp(levelId) {
    const index = currentQuiz.levels.findIndex(level => level.id === levelId);
    if (index > 0) {
        // Swap levels
        [currentQuiz.levels[index], currentQuiz.levels[index - 1]] = 
        [currentQuiz.levels[index - 1], currentQuiz.levels[index]];
        
        // Update orders
        currentQuiz.levels[index].order = index + 1;
        currentQuiz.levels[index - 1].order = index;
        
        // Save to localStorage
        localStorage.setItem(STORAGE_KEY, JSON.stringify(quizData));
        
        // Update UI
        updateLevelList();
    }
}

function moveLevelDown(levelId) {
    const index = currentQuiz.levels.findIndex(level => level.id === levelId);
    if (index < currentQuiz.levels.length - 1) {
        // Swap levels
        [currentQuiz.levels[index], currentQuiz.levels[index + 1]] = 
        [currentQuiz.levels[index + 1], currentQuiz.levels[index]];
        
        // Update orders
        currentQuiz.levels[index].order = index + 1;
        currentQuiz.levels[index + 1].order = index + 2;
        
        // Save to localStorage
        localStorage.setItem(STORAGE_KEY, JSON.stringify(quizData));
        
        // Update UI
        updateLevelList();
    }
}

function editLevel(levelId) {
    // For simplicity, we'll just allow deletion and recreation
    // In a more advanced version, you could implement a proper edit form
    const level = currentQuiz.levels.find(l => l.id === levelId);
    if (level) {
        levelNameInput.value = level.name;
        levelColor1Input.value = level.color1;
        levelColor2Input.value = level.color2;
        
        // Delete the old level and create a new one when Add is clicked
        deleteLevel(levelId);
    }
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
    if (!currentQuiz) {
        showModal("Please create a quiz first!", 'error');
        return;
    }
    
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
    if (!currentQuiz.questions) {
        currentQuiz.questions = {};
    }
    if (!currentQuiz.questions[levelId]) {
        currentQuiz.questions[levelId] = [];
    }
    currentQuiz.questions[levelId].push(newQuestion);

    // Save to localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(quizData));

    // Reset the form
    resetAdminForm();

    // Update UI
    updateLevelList();
    updateQuestionsList();
    
    showModal(`Question added to level! The correct answer will be randomly positioned.`, 'success');
}

function resetQuestions() {
    if (confirm("Are you sure you want to reset all questions in this quiz? This cannot be undone.")) {
        currentQuiz.questions = {};
        localStorage.setItem(STORAGE_KEY, JSON.stringify(quizData));
        
        // Update UI
        updateLevelList();
        updateQuestionsList();
        
        showModal("All questions have been reset!", 'success');
    }
}

// Initialize the admin panel
initAdmin();
 
