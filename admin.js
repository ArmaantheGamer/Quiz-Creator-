// Use a key for localStorage
const STORAGE_KEY = 'mediaQuiz_Quizzes';

// Default empty data structure
const defaultData = {
    quizzes: []
};

// DOM elements
const quizNameInput = document.getElementById('quiz-name');
const saveQuizNameBtn = document.getElementById('save-quiz-name-btn');
const currentQuizInfo = document.getElementById('current-quiz-info');
const currentQuizName = document.getElementById('current-quiz-name');
const currentQuizId = document.getElementById('current-quiz-id');
const levelSelect = document.getElementById('admin-difficulty');
const levelNameInput = document.getElementById('level-name');
const levelColor1Input = document.getElementById('level-color1');
const levelColor2Input = document.getElementById('level-color2');
const addLevelBtn = document.getElementById('add-level-btn');
const levelList = document.getElementById('level-list');
const addQuestionBtn = document.getElementById('add-question-btn');
const resetQuestionsBtn = document.getElementById('reset-questions-btn');
const viewQuestionsBtn = document.getElementById('view-questions-btn');
const errorModal = document.getElementById('error-modal');
const modalMessage = document.getElementById('modal-message');
const modalOkBtn = document.getElementById('modal-ok-btn');
const questionsList = document.getElementById('questions-list');
const questionEditorModal = document.getElementById('question-editor-modal');
const editQuestionInput = document.getElementById('edit-question');
const editOption1Input = document.getElementById('edit-option1');
const editOption2Input = document.getElementById('edit-option2');
const editOption3Input = document.getElementById('edit-option3');
const editOption4Input = document.getElementById('edit-option4');
const editDisplayMediaUrl = document.getElementById('edit-display-media-url');
const editAfterMediaUrl = document.getElementById('edit-after-media-url');
const editQuestionCancelBtn = document.getElementById('edit-question-cancel-btn');
const editQuestionSaveBtn = document.getElementById('edit-question-save-btn');

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
        quizData = JSON.parse(savedData);
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
            currentQuizName.textContent = quiz.name;
            currentQuizId.textContent = quiz.id;
            currentQuizInfo.style.display = 'block';
            
            updateLevelSelect();
            updateLevelList();
            updateQuestionsList();
        }
    }

    // Event listeners
    saveQuizNameBtn.addEventListener('click', saveQuizName);
    addQuestionBtn.addEventListener('click', addCustomQuestion);
    resetQuestionsBtn.addEventListener('click', resetQuestions);
    viewQuestionsBtn.addEventListener('click', viewQuestions);
    modalOkBtn.addEventListener('click', () => {
        errorModal.style.display = 'none';
    });
    
    // Level management
    addLevelBtn.addEventListener('click', addCustomLevel);
    
    // Media upload previews
    setupMediaUpload('display');
    setupMediaUpload('after');
    setupMediaUpload('edit-display');
    setupMediaUpload('edit-after');
    
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
            if (forSection === 'display' || forSection === 'edit-display') {
                const previewPrefix = forSection === 'edit-display' ? 'edit-' : '';
                if (type === 'image') {
                    document.getElementById(`${previewPrefix}display-media-preview`).style.display = 'block';
                    document.getElementById(`${previewPrefix}display-video-preview`).style.display = 'none';
                } else {
                    document.getElementById(`${previewPrefix}display-media-preview`).style.display = 'none';
                    document.getElementById(`${previewPrefix}display-video-preview`).style.display = 'block';
                }
            } else {
                const previewPrefix = forSection === 'edit-after' ? 'edit-' : '';
                if (type === 'image') {
                    document.getElementById(`${previewPrefix}after-media-preview`).style.display = 'block';
                    document.getElementById(`${previewPrefix}after-video-preview`).style.display = 'none';
                } else {
                    document.getElementById(`${previewPrefix}after-media-preview`).style.display = 'none';
                    document.getElementById(`${previewPrefix}after-video-preview`).style.display = 'block';
                }
            }
        });
    });
    
    // Question editor
    editQuestionCancelBtn.addEventListener('click', () => {
        questionEditorModal.style.display = 'none';
    });
    
    editQuestionSaveBtn.addEventListener('click', saveEditedQuestion);
}

function saveQuizName() {
    const name = quizNameInput.value.trim();
    
    if (!name) {
        showModal("Please enter a quiz name!");
        return;
    }
    
    // Create a simple ID for the quiz
    const id = name.toLowerCase().replace(/\s+/g, '-');
    
    // Check if quiz with this name already exists
    const existingQuiz = quizData.quizzes.find(q => q.id === id);
    
    if (existingQuiz) {
        // Use existing quiz
        currentQuiz = existingQuiz;
    } else {
        // Create new quiz
        currentQuiz = {
            id,
            name,
            levels: [],
            questions: {}
        };
        quizData.quizzes.push(currentQuiz);
    }
    
    // Save to localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(quizData));
    
    // Update UI
    currentQuizName.textContent = currentQuiz.name;
    currentQuizId.textContent = currentQuiz.id;
    currentQuizInfo.style.display = 'block';
    
    updateLevelSelect();
    updateLevelList();
    
    showModal(`Quiz "${name}" ${existingQuiz ? 'loaded' : 'created'} successfully!`);
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
        
        const questionCount = currentQuiz.questions[level.id] ? currentQuiz.questions[level.id].length : 0;
        
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
        if (currentQuiz.questions[level.id] && currentQuiz.questions[level.id].length > 0) {
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
        questionsList.innerHTML = '<p>No questions added yet. Add questions using the form above.</p>';
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

function editQuestion(levelId, index) {
    if (!currentQuiz.questions[levelId] || !currentQuiz.questions[levelId][index]) {
        showModal("Question not found!");
        return;
    }
    
    const question = currentQuiz.questions[levelId][index];
    
    // Fill the edit form with question data
    editQuestionInput.value = question.question;
    editOption1Input.value = question.options[0];
    editOption2Input.value = question.options[1];
    editOption3Input.value = question.options[2];
    editOption4Input.value = question.options[3];
    
    // Set media URLs
    if (question.displayMedia && question.displayMedia.url) {
        editDisplayMediaUrl.value = question.displayMedia.url;
        
        // Set preview
        if (question.displayMedia.type === 'image') {
            document.getElementById('edit-display-media-preview').src = question.displayMedia.url;
            document.getElementById('edit-display-media-preview').style.display = 'block';
            document.getElementById('edit-display-video-preview').style.display = 'none';
            document.querySelector('.media-type-btn[data-for="edit-display"][data-type="image"]').classList.add('active');
            document.querySelector('.media-type-btn[data-for="edit-display"][data-type="video"]').classList.remove('active');
        } else {
            document.getElementById('edit-display-video-preview').src = question.displayMedia.url;
            document.getElementById('edit-display-video-preview').style.display = 'block';
            document.getElementById('edit-display-media-preview').style.display = 'none';
            document.querySelector('.media-type-btn[data-for="edit-display"][data-type="video"]').classList.add('active');
            document.querySelector('.media-type-btn[data-for="edit-display"][data-type="image"]').classList.remove('active');
        }
    } else {
        editDisplayMediaUrl.value = '';
        document.getElementById('edit-display-media-preview').style.display = 'none';
        document.getElementById('edit-display-video-preview').style.display = 'none';
    }
    
    if (question.afterMedia && question.afterMedia.url) {
        editAfterMediaUrl.value = question.afterMedia.url;
        
        // Set preview
        if (question.afterMedia.type === 'image') {
            document.getElementById('edit-after-media-preview').src = question.afterMedia.url;
            document.getElementById('edit-after-media-preview').style.display = 'block';
            document.getElementById('edit-after-video-preview').style.display = 'none';
            document.querySelector('.media-type-btn[data-for="edit-after"][data-type="image"]').classList.add('active');
            document.querySelector('.media-type-btn[data-for="edit-after"][data-type="video"]').classList.remove('active');
        } else {
            document.getElementById('edit-after-video-preview').src = question.afterMedia.url;
            document.getElementById('edit-after-video-preview').style.display = 'block';
            document.getElementById('edit-after-media-preview').style.display = 'none';
            document.querySelector('.media-type-btn[data-for="edit-after"][data-type="video"]').classList.add('active');
            document.querySelector('.media-type-btn[data-for="edit-after"][data-type="image"]').classList.remove('active');
        }
    } else {
        editAfterMediaUrl.value = '';
        document.getElementById('edit-after-media-preview').style.display = 'none';
        document.getElementById('edit-after-video-preview').style.display = 'none';
    }
    
    // Store editing context
    currentEditingQuestion = question;
    currentEditingLevelId = levelId;
    currentEditingQuestionIndex = index;
    
    // Show the editor modal
    questionEditorModal.style.display = 'flex';
}

function saveEditedQuestion() {
    if (!currentEditingQuestion || !currentEditingLevelId || currentEditingQuestionIndex === null) {
        showModal("No question to save!");
        return;
    }
    
    const questionText = editQuestionInput.value;
    const option1 = editOption1Input.value;
    const option2 = editOption2Input.value;
    const option3 = editOption3Input.value;
    const option4 = editOption4Input.value;
    
    // Get display media type and URL
    const displayMediaType = document.querySelector('.media-type-btn[data-for="edit-display"].active').getAttribute('data-type');
    const displayMediaUrl = editDisplayMediaUrl.value;
    
    // Get after-answer media type and URL
    const afterMediaType = document.querySelector('.media-type-btn[data-for="edit-after"].active').getAttribute('data-type');
    const afterMediaUrl = editAfterMediaUrl.value;

    // Validate inputs
    if (!questionText || !option1 || !option2 || !option3 || !option4) {
        showModal("Please fill in all question and answer fields!");
        return;
    }

    // Update the question
    currentEditingQuestion.question = questionText;
    currentEditingQuestion.options = [option1, option2, option3, option4];
    
    currentEditingQuestion.displayMedia = displayMediaUrl ? {
        type: displayMediaType,
        url: displayMediaUrl
    } : null;
    
    currentEditingQuestion.afterMedia = afterMediaUrl ? {
        type: afterMediaType,
        url: afterMediaUrl
    } : null;

    // Save to localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(quizData));

    // Update UI
    updateQuestionsList();
    
    // Close the modal
    questionEditorModal.style.display = 'none';
    
    showModal("Question updated successfully!");
}

function deleteQuestion(levelId, index) {
    if (!confirm("Are you sure you want to delete this question?")) {
        return;
    }
    
    if (!currentQuiz.questions[levelId] || !currentQuiz.questions[levelId][index]) {
        showModal("Question not found!");
        return;
    }
    
    // Remove the question
    currentQuiz.questions[levelId].splice(index, 1);
    
    // Save to localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(quizData));
    
    // Update UI
    updateQuestionsList();
    updateLevelList();
    
    showModal("Question deleted successfully!");
}

function showModal(message) {
    modalMessage.textContent = message;
    errorModal.style.display = 'flex';
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
        showModal("Please create a quiz first!");
        return;
    }
    
    const name = levelNameInput.value.trim();
    const color1 = levelColor1Input.value;
    const color2 = levelColor2Input.value;
    
    if (!name) {
        showModal("Please enter a level name!");
        return;
    }
    
    // Create a simple ID for the level
    const id = `${currentQuiz.id}-${name.toLowerCase().replace(/\s+/g, '-')}`;
    
    // Check if level with this name already exists
    if (currentQuiz.levels.some(level => level.id === id)) {
        showModal("A level with this name already exists in this quiz!");
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
    
    showModal(`Level "${name}" created successfully!`);
}

function deleteLevel(levelId) {
    if (!confirm("Are you sure you want to delete this level? All questions in this level will also be deleted.")) {
        return;
    }
    
    // Remove level from levels array
    currentQuiz.levels = currentQuiz.levels.filter(level => level.id !== levelId);
    
    // Remove questions for this level
    delete currentQuiz.questions[levelId];
    
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
    
    showModal("Level deleted successfully!");
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
        showModal("Please create a quiz first!");
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
        showModal("Please select a level first!");
        return;
    }
    
    if (!questionText || !option1 || !option2 || !option3 || !option4) {
        showModal("Please fill in all question and answer fields!");
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
    
    showModal(`Question added to level! The correct answer will be randomly positioned.`);
}

function resetQuestions() {
    if (confirm("Are you sure you want to reset all questions in this quiz? This cannot be undone.")) {
        currentQuiz.questions = {};
        localStorage.setItem(STORAGE_KEY, JSON.stringify(quizData));
        
        // Update UI
        updateLevelList();
        updateQuestionsList();
        
        showModal("All questions have been reset!");
    }
}

function viewQuestions() {
    if (!currentQuiz) {
        showModal("Please create a quiz first!");
        return;
    }
    
    let message = `Questions in "${currentQuiz.name}":\n\n`;
    
    for (const levelId in currentQuiz.questions) {
        const level = currentQuiz.levels.find(l => l.id === levelId);
        const levelName = level ? level.name : levelId;
        
        message += `--- ${levelName.toUpperCase()} (${currentQuiz.questions[levelId].length} questions) ---\n`;
        
        if (currentQuiz.questions[levelId].length === 0) {
            message += "No questions yet\n\n";
        } else {
            currentQuiz.questions[levelId].forEach((q, i) =>{
                message += `${i+1}. ${q.question}\n`;
                message += `   Correct Answer: ${q.options[0]}\n\n`;
            });
            message += "\n";
        }
    }
    
    alert(message);
}

// Initialize the admin panel
initAdmin();
