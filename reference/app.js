// Application data with scenarios and intelligent routing
const appData = {
  "scenarios": [
    {
      "id": "married_vn_vn",
      "name": "Married Vietnamese Parents", 
      "nameVn": "Cha mẹ Việt Nam đã kết hôn",
      "authority": "Commune-level People's Committee",
      "authorityVn": "Ủy ban nhân dân cấp xã",
      "timeline": "Same day",
      "timelineVn": "Trong ngày",
      "complexity": "Low",
      "complexityVn": "Đơn giản",
      "agents": ["intake", "validation", "extraction", "verification", "approval", "generation"],
      "documents": [
        {"name": "Birth declaration form", "nameVn": "Tờ khai đăng ký khai sinh", "required": true},
        {"name": "Marriage certificate", "nameVn": "Giấy chứng nhận kết hôn", "required": true},
        {"name": "Parents' ID cards", "nameVn": "CMND/CCCD của cha mẹ", "required": true},
        {"name": "Hospital birth certificate", "nameVn": "Giấy chứng sinh", "required": true}
      ]
    },
    {
      "id": "married_vn_foreign",
      "name": "Married Vietnamese + Foreign Parent",
      "nameVn": "Cha mẹ đã kết hôn (một người Việt Nam, một người nước ngoài)", 
      "authority": "Provincial Department of Justice",
      "authorityVn": "Sở Tư pháp cấp tỉnh",
      "timeline": "1-3 working days",
      "timelineVn": "1-3 ngày làm việc",
      "complexity": "Medium",
      "complexityVn": "Trung bình",
      "agents": ["intake", "validation", "extraction", "embassy", "nationality", "verification", "approval", "generation"],
      "documents": [
        {"name": "Birth declaration form", "nameVn": "Tờ khai đăng ký khai sinh", "required": true},
        {"name": "Marriage certificate", "nameVn": "Giấy chứng nhận kết hôn", "required": true},
        {"name": "Vietnamese parent's ID", "nameVn": "CMND/CCCD của cha/mẹ Việt Nam", "required": true},
        {"name": "Foreign parent's passport", "nameVn": "Hộ chiếu của cha/mẹ nước ngoài", "required": true},
        {"name": "Hospital birth certificate", "nameVn": "Giấy chứng sinh", "required": true},
        {"name": "Nationality agreement", "nameVn": "Thỏa thuận về quốc tịch cho trẻ", "required": true},
        {"name": "Embassy authentication documents", "nameVn": "Giấy tờ xác thực từ đại sứ quán", "required": true}
      ]
    },
    {
      "id": "unmarried_vn_vn", 
      "name": "Unmarried Vietnamese Parents",
      "nameVn": "Cha mẹ Việt Nam chưa kết hôn",
      "authority": "District-level People's Committee", 
      "authorityVn": "Ủy ban nhân dân cấp huyện",
      "timeline": "1-2 working days",
      "timelineVn": "1-2 ngày làm việc", 
      "complexity": "Medium",
      "complexityVn": "Trung bình",
      "agents": ["intake", "validation", "extraction", "paternity", "verification", "approval", "generation"],
      "documents": [
        {"name": "Birth declaration form", "nameVn": "Tờ khai đăng ký khai sinh", "required": true},
        {"name": "Parents' ID cards", "nameVn": "CMND/CCCD của cha mẹ", "required": true},
        {"name": "Hospital birth certificate", "nameVn": "Giấy chứng sinh", "required": true},
        {"name": "Paternity recognition form", "nameVn": "Đơn xác nhận cha con", "required": true},
        {"name": "Witness statements (2 people)", "nameVn": "Lời khai của nhân chứng (2 người)", "required": true}
      ]
    },
    {
      "id": "unmarried_vn_foreign",
      "name": "Unmarried Vietnamese + Foreign Parent",
      "nameVn": "Cha mẹ chưa kết hôn (một người Việt Nam, một người nước ngoài)",
      "authority": "Provincial Department of Justice",
      "authorityVn": "Sở Tư pháp cấp tỉnh", 
      "timeline": "15 working days",
      "timelineVn": "15 ngày làm việc",
      "complexity": "High", 
      "complexityVn": "Phức tạp",
      "agents": ["intake", "validation", "extraction", "paternity", "dna", "embassy", "nationality", "verification", "approval", "generation"],
      "documents": [
        {"name": "Birth declaration form", "nameVn": "Tờ khai đăng ký khai sinh", "required": true},
        {"name": "Vietnamese parent's ID", "nameVn": "CMND/CCCD của cha/mẹ Việt Nam", "required": true}, 
        {"name": "Foreign parent's passport", "nameVn": "Hộ chiếu của cha/mẹ nước ngoài", "required": true},
        {"name": "Hospital birth certificate", "nameVn": "Giấy chứng sinh", "required": true},
        {"name": "Paternity recognition form", "nameVn": "Đơn xác nhận cha con", "required": true},
        {"name": "DNA test results", "nameVn": "Kết quả xét nghiệm ADN", "required": true},
        {"name": "Embassy authentication documents", "nameVn": "Giấy tờ xác thực từ đại sứ quán", "required": true},
        {"name": "Nationality agreement", "nameVn": "Thỏa thuận về quốc tịch cho trẻ", "required": true},
        {"name": "Witness statements (2 people)", "nameVn": "Lời khai của nhân chứng (2 người)", "required": true}
      ]
    },
    {
      "id": "single_parent",
      "name": "Single Parent Registration",
      "nameVn": "Đăng ký một phụ huynh",
      "authority": "Commune-level People's Committee",
      "authorityVn": "Ủy ban nhân dân cấp xã",
      "timeline": "Same day", 
      "timelineVn": "Trong ngày",
      "complexity": "Low",
      "complexityVn": "Đơn giản", 
      "agents": ["intake", "validation", "extraction", "verification", "approval", "generation"],
      "documents": [
        {"name": "Birth declaration form", "nameVn": "Tờ khai đăng ký khai sinh", "required": true},
        {"name": "Mother's ID card", "nameVn": "CMND/CCCD của mẹ", "required": true},
        {"name": "Hospital birth certificate", "nameVn": "Giấy chứng sinh", "required": true}
      ]
    },
    {
      "id": "late_registration",
      "name": "Late Registration (>60 days)",
      "nameVn": "Đăng ký trễ hạn (>60 ngày)",
      "authority": "Varies by case",
      "authorityVn": "Tùy theo từng trường hợp", 
      "timeline": "3-15 working days",
      "timelineVn": "3-15 ngày làm việc",
      "complexity": "High",
      "complexityVn": "Phức tạp",
      "agents": ["intake", "validation", "extraction", "late", "verification", "approval", "generation"],
      "documents": [
        {"name": "All standard documents for scenario", "nameVn": "Tất cả giấy tờ theo từng trường hợp", "required": true},
        {"name": "Explanation letter for delay", "nameVn": "Đơn giải thích lý do trễ hạn", "required": true},
        {"name": "Ward committee confirmation", "nameVn": "Giấy xác nhận từ UBND phường/xã", "required": true},
        {"name": "Additional witness statements", "nameVn": "Lời khai bổ sung của nhân chứng", "required": false}
      ]
    }
  ],
  "agents": [
    {
      "id": "intake",
      "name": "Document Intake Agent", 
      "nameVn": "Agent Tiếp Nhận Hồ Sơ",
      "icon": "📥",
      "description": "Receives and classifies documents",
      "descriptionVn": "Tiếp nhận và phân loại hồ sơ"
    },
    {
      "id": "validation",
      "name": "Validation Agent",
      "nameVn": "Agent Xác Thực", 
      "icon": "✅",
      "description": "Verifies document authenticity",
      "descriptionVn": "Xác thực tính hợp lệ của giấy tờ"
    },
    {
      "id": "extraction", 
      "name": "Data Extraction Agent",
      "nameVn": "Agent Trích Xuất Dữ Liệu",
      "icon": "🔍",
      "description": "Extracts information using OCR/NLP", 
      "descriptionVn": "Trích xuất thông tin bằng OCR/NLP"
    },
    {
      "id": "paternity",
      "name": "Paternity Recognition Agent",
      "nameVn": "Agent Xác Nhận Cha Con", 
      "icon": "👨‍👧‍👦",
      "description": "Handles paternity acknowledgment",
      "descriptionVn": "Xử lý xác nhận quan hệ cha con"
    },
    {
      "id": "dna",
      "name": "DNA Verification Agent",
      "nameVn": "Agent Xác Minh ADN",
      "icon": "🧬", 
      "description": "Manages DNA test verification",
      "descriptionVn": "Quản lý xác minh xét nghiệm ADN"
    },
    {
      "id": "embassy",
      "name": "Embassy Document Agent",
      "nameVn": "Agent Giấy Tờ Đại Sứ Quán",
      "icon": "🏛️",
      "description": "Handles foreign document authentication", 
      "descriptionVn": "Xử lý xác thực giấy tờ nước ngoài"
    },
    {
      "id": "nationality", 
      "name": "Nationality Agreement Agent",
      "nameVn": "Agent Thỏa Thuận Quốc Tịch",
      "icon": "🌍",
      "description": "Processes nationality selection",
      "descriptionVn": "Xử lý lựa chọn quốc tịch"
    },
    {
      "id": "late",
      "name": "Late Registration Agent", 
      "nameVn": "Agent Đăng Ký Trễ Hạn",
      "icon": "⏰",
      "description": "Handles delayed registration requirements",
      "descriptionVn": "Xử lý yêu cầu đăng ký trễ hạn"
    },
    {
      "id": "verification",
      "name": "Database Verification Agent",
      "nameVn": "Agent Xác Minh Cơ Sở Dữ Liệu", 
      "icon": "🔄",
      "description": "Cross-checks with databases",
      "descriptionVn": "Kiểm tra chéo với cơ sở dữ liệu"
    },
    {
      "id": "approval",
      "name": "Approval Agent",
      "nameVn": "Agent Phê Duyệt",
      "icon": "👥", 
      "description": "Final review and approval",
      "descriptionVn": "Xem xét và phê duyệt cuối cùng"
    },
    {
      "id": "generation",
      "name": "Certificate Generation Agent", 
      "nameVn": "Agent Tạo Giấy Chứng Nhận",
      "icon": "📄",
      "description": "Creates birth certificate",
      "descriptionVn": "Tạo giấy khai sinh"
    }
  ],
  "assessmentQuestions": [
    {
      "id": "married",
      "question": "Are the parents legally married?",
      "questionVn": "Cha mẹ đã đăng ký kết hôn chưa?",
      "options": [
        {"value": "yes", "text": "Yes", "textVn": "Có"},
        {"value": "no", "text": "No", "textVn": "Không"}
      ]
    },
    {
      "id": "foreign",
      "question": "Is either parent a foreign national?", 
      "questionVn": "Có cha hoặc mẹ nào là người nước ngoài không?",
      "options": [
        {"value": "yes", "text": "Yes", "textVn": "Có"},
        {"value": "no", "text": "No", "textVn": "Không"}
      ]
    },
    {
      "id": "timing",
      "question": "Is this registration being done within 60 days of birth?",
      "questionVn": "Việc đăng ký có được thực hiện trong vòng 60 ngày sau sinh không?", 
      "options": [
        {"value": "yes", "text": "Yes", "textVn": "Có"},
        {"value": "no", "text": "No", "textVn": "Không"}
      ]
    },
    {
      "id": "paternity",
      "question": "Do you need paternity recognition? (for unmarried parents)",
      "questionVn": "Có cần xác nhận quan hệ cha con không? (đối với cha mẹ chưa kết hôn)",
      "options": [
        {"value": "yes", "text": "Yes", "textVn": "Có"}, 
        {"value": "no", "text": "No", "textVn": "Không"},
        {"value": "na", "text": "Not applicable", "textVn": "Không áp dụng"}
      ]
    },
    {
      "id": "father_present",
      "question": "Is the father present and willing to be listed on the birth certificate?",
      "questionVn": "Cha có mặt và sẵn sàng được ghi tên trên giấy khai sinh không?",
      "options": [
        {"value": "yes", "text": "Yes", "textVn": "Có"},
        {"value": "no", "text": "No", "textVn": "Không"}
      ]
    }
  ]
};

// Application state
let currentView = 'landing-page';
let selectedScenario = null;
let assessmentAnswers = {};
let uploadedDocuments = [];
let processingState = {
  overallProgress: 0,
  agents: {},
  notifications: [],
  timeRemaining: 60
};

// Utility functions
function showView(viewId) {
  // Hide all views
  document.querySelectorAll('.view').forEach(view => {
    view.classList.remove('active');
  });
  
  // Show target view
  const targetView = document.getElementById(viewId);
  if (targetView) {
    targetView.classList.add('active');
    currentView = viewId;
  }
}

function formatTime(minutes) {
  if (minutes < 60) {
    return `${minutes} phút / ${minutes} minutes`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}:${mins.toString().padStart(2, '0')} giờ / ${hours}:${mins.toString().padStart(2, '0')} hours`;
}

// Scenario determination logic
function determineScenario(answers) {
  const { married, foreign, timing, paternity, father_present } = answers;
  
  // Late registration overrides other scenarios
  if (timing === 'no') {
    return appData.scenarios.find(s => s.id === 'late_registration');
  }
  
  // Single parent case
  if (father_present === 'no') {
    return appData.scenarios.find(s => s.id === 'single_parent');
  }
  
  // Married parents
  if (married === 'yes') {
    if (foreign === 'yes') {
      return appData.scenarios.find(s => s.id === 'married_vn_foreign');
    } else {
      return appData.scenarios.find(s => s.id === 'married_vn_vn');
    }
  }
  
  // Unmarried parents
  if (married === 'no') {
    if (foreign === 'yes') {
      return appData.scenarios.find(s => s.id === 'unmarried_vn_foreign');
    } else {
      return appData.scenarios.find(s => s.id === 'unmarried_vn_vn');
    }
  }
  
  // Default to simplest case
  return appData.scenarios.find(s => s.id === 'married_vn_vn');
}

// Event handling functions
function handleStartAssessment() {
  showView('smart-assessment');
  populateQuestionnaire();
}

function handleBackToLanding() {
  showView('landing-page');
}

function handleQuestionAnswer(questionId, value) {
  assessmentAnswers[questionId] = value;
  
  // Update UI
  const questionItem = document.querySelector(`[data-question-id="${questionId}"]`);
  if (questionItem) {
    const options = questionItem.querySelectorAll('.option-button');
    options.forEach(option => {
      option.classList.remove('selected');
      if (option.dataset.value === value) {
        option.classList.add('selected');
      }
    });
  }
  
  // Check if we have enough answers to determine scenario
  checkAssessmentComplete();
}

function checkAssessmentComplete() {
  const requiredQuestions = ['married', 'foreign', 'timing', 'father_present'];
  const hasRequired = requiredQuestions.every(q => assessmentAnswers[q]);
  
  if (hasRequired) {
    selectedScenario = determineScenario(assessmentAnswers);
    showScenarioResult();
  }
}

function showScenarioResult() {
  const resultElement = document.getElementById('scenario-result');
  const scenarioInfoElement = document.getElementById('scenario-info');
  
  if (selectedScenario && scenarioInfoElement) {
    scenarioInfoElement.innerHTML = `
      <div class="scenario-name">${selectedScenario.name}</div>
      <div class="scenario-name-vn">${selectedScenario.nameVn}</div>
      
      <div class="scenario-meta">
        <div class="meta-item">
          <div class="meta-icon">🏛️</div>
          <div>
            <div class="meta-label">Authority:</div>
            <div class="meta-value">${selectedScenario.authority}</div>
            <div class="meta-value">${selectedScenario.authorityVn}</div>
          </div>
        </div>
        
        <div class="meta-item">
          <div class="meta-icon">⏱️</div>
          <div>
            <div class="meta-label">Timeline:</div>
            <div class="meta-value">${selectedScenario.timeline}</div>
            <div class="meta-value">${selectedScenario.timelineVn}</div>
          </div>
        </div>
        
        <div class="meta-item">
          <div class="meta-icon">📊</div>
          <div>
            <div class="meta-label">Complexity:</div>
            <div class="meta-value">${selectedScenario.complexity} / ${selectedScenario.complexityVn}</div>
          </div>
        </div>
      </div>
      
      <div class="scenario-documents">
        <h4>Required Documents / Tài liệu cần thiết:</h4>
        <div class="documents-preview">
          ${selectedScenario.documents.map(doc => `
            <div class="document-tag">${doc.nameVn}</div>
          `).join('')}
        </div>
      </div>
    `;
  }
  
  if (resultElement) {
    resultElement.style.display = 'block';
  }
}

function handleProceedToDocuments() {
  showView('document-submission');
  populateSelectedScenario();
  populateDocumentChecklist();
  setupUploadAreas();
}

function handleSubmitDocuments() {
  if (uploadedDocuments.length === selectedScenario.documents.length) {
    showView('processing-dashboard');
    setTimeout(() => {
      startProcessing();
    }, 500);
  }
}

function handleDownloadCertificate() {
  alert('Giấy khai sinh số đã được tải về!\nDigital birth certificate downloaded!');
}

function handleRequestPhysical() {
  alert('Yêu cầu bản giấy đã được gửi. Bạn sẽ nhận được thông báo khi sẵn sàng.\n\nPhysical copy request sent. You will be notified when ready.');
}

function handleStartNew() {
  resetApplication();
  showView('landing-page');
}

// Initialize application
function setupEventListeners() {
  // Use event delegation for better reliability
  document.addEventListener('click', (e) => {
    // Start assessment button
    if (e.target.classList.contains('start-assessment') || 
        e.target.closest('.start-assessment')) {
      e.preventDefault();
      handleStartAssessment();
      return;
    }

    // Back buttons
    if (e.target.classList.contains('back-btn') || 
        e.target.closest('.back-btn')) {
      e.preventDefault();
      handleBackToLanding();
      return;
    }

    // Question option buttons
    if (e.target.classList.contains('option-button') || 
        e.target.closest('.option-button')) {
      e.preventDefault();
      const button = e.target.closest('.option-button') || e.target;
      const questionId = button.dataset.questionId;
      const value = button.dataset.value;
      if (questionId && value) {
        handleQuestionAnswer(questionId, value);
      }
      return;
    }

    // Proceed to documents button
    if (e.target.classList.contains('proceed-to-documents') || 
        e.target.closest('.proceed-to-documents')) {
      e.preventDefault();
      handleProceedToDocuments();
      return;
    }

    // Submit documents button
    if (e.target.id === 'submit-documents') {
      e.preventDefault();
      handleSubmitDocuments();
      return;
    }

    // Download certificate button
    if (e.target.classList.contains('download-digital') || 
        e.target.closest('.download-digital')) {
      e.preventDefault();
      handleDownloadCertificate();
      return;
    }

    // Request physical copy button
    if (e.target.classList.contains('request-physical') || 
        e.target.closest('.request-physical')) {
      e.preventDefault();
      handleRequestPhysical();
      return;
    }

    // Start new registration button
    if (e.target.classList.contains('start-new') || 
        e.target.closest('.start-new')) {
      e.preventDefault();
      handleStartNew();
      return;
    }

    // Upload area clicks
    if (e.target.classList.contains('upload-area') || 
        e.target.closest('.upload-area')) {
      e.preventDefault();
      const uploadArea = e.target.closest('.upload-area') || e.target;
      const docIndex = parseInt(uploadArea.dataset.docIndex);
      if (!isNaN(docIndex)) {
        simulateFileUpload(docIndex);
      }
      return;
    }
  });
}

function populateScenariosOverview() {
  const scenariosGrid = document.getElementById('scenarios-grid');
  if (!scenariosGrid) return;

  scenariosGrid.innerHTML = appData.scenarios.map(scenario => `
    <div class="scenario-card">
      <div class="scenario-header">
        <h4 class="scenario-title">${scenario.nameVn}</h4>
        <div class="complexity-badge ${scenario.complexity.toLowerCase()}">
          ${scenario.complexityVn}
        </div>
      </div>
      <div class="scenario-details">
        <div class="scenario-detail">
          <span class="detail-icon">🏛️</span>
          <span>${scenario.authorityVn}</span>
        </div>
        <div class="scenario-detail">
          <span class="detail-icon">⏱️</span>
          <span>${scenario.timelineVn}</span>
        </div>
        <div class="scenario-detail">
          <span class="detail-icon">📋</span>
          <span>${scenario.documents.length} tài liệu</span>
        </div>
      </div>
    </div>
  `).join('');
}

function populateQuestionnaire() {
  const questionnaire = document.getElementById('questionnaire');
  if (!questionnaire) return;

  questionnaire.innerHTML = appData.assessmentQuestions.map(question => `
    <div class="question-item" data-question-id="${question.id}">
      <div class="question-text">${question.question}</div>
      <div class="question-text-vn">${question.questionVn}</div>
      <div class="question-options">
        ${question.options.map(option => `
          <div class="option-button" data-question-id="${question.id}" data-value="${option.value}">
            <div class="option-radio"></div>
            <div class="option-text">
              <div>${option.text}</div>
              <div class="option-text-vn">${option.textVn}</div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `).join('');
}

function populateSelectedScenario() {
  const selectedScenarioCard = document.getElementById('selected-scenario-card');
  if (!selectedScenarioCard || !selectedScenario) return;

  selectedScenarioCard.innerHTML = `
    <div class="selected-scenario-title">
      <span class="selected-scenario-name">${selectedScenario.nameVn}</span>
      <div class="complexity-badge ${selectedScenario.complexity.toLowerCase()}">
        ${selectedScenario.complexityVn}
      </div>
    </div>
    <div class="scenario-meta">
      <div class="meta-item">
        <span class="meta-icon">🏛️</span>
        <span>${selectedScenario.authorityVn}</span>
      </div>
      <div class="meta-item">
        <span class="meta-icon">⏱️</span>
        <span>${selectedScenario.timelineVn}</span>
      </div>
    </div>
  `;
}

function populateDocumentChecklist() {
  const checklist = document.getElementById('document-checklist');
  if (!checklist || !selectedScenario) return;

  checklist.innerHTML = selectedScenario.documents.map((doc, index) => `
    <div class="document-item" data-doc-index="${index}">
      <div class="document-checkbox" id="checkbox-${index}"></div>
      <div class="document-info">
        <h4>${doc.nameVn}</h4>
        <p>${doc.name}</p>
      </div>
    </div>
  `).join('');
}

function setupUploadAreas() {
  const uploadContainer = document.getElementById('upload-areas');
  if (!uploadContainer || !selectedScenario) return;

  uploadContainer.innerHTML = selectedScenario.documents.map((doc, index) => `
    <div class="upload-area" data-doc-index="${index}">
      <div class="upload-icon">📎</div>
      <div class="upload-text">${doc.nameVn}</div>
      <p class="upload-hint">Kéo thả file hoặc click để chọn / Drag & drop or click to select</p>
    </div>
  `).join('');

  // Add drag and drop functionality
  document.querySelectorAll('.upload-area').forEach(area => {
    area.addEventListener('dragover', handleDragOver);
    area.addEventListener('drop', handleFileDrop);
    area.addEventListener('dragleave', handleDragLeave);
  });
}

function handleDragOver(event) {
  event.preventDefault();
  event.currentTarget.classList.add('dragover');
}

function handleDragLeave(event) {
  event.currentTarget.classList.remove('dragover');
}

function handleFileDrop(event) {
  event.preventDefault();
  event.currentTarget.classList.remove('dragover');
  const docIndex = parseInt(event.currentTarget.dataset.docIndex);
  if (!isNaN(docIndex)) {
    simulateFileUpload(docIndex);
  }
}

function simulateFileUpload(docIndex) {
  const uploadArea = document.querySelector(`.upload-area[data-doc-index="${docIndex}"]`);
  const checkbox = document.getElementById(`checkbox-${docIndex}`);
  const documentItem = document.querySelector(`.document-item[data-doc-index="${docIndex}"]`);

  if (!uploadArea) return;

  // Prevent duplicate uploads
  if (uploadedDocuments.includes(docIndex)) return;

  // Simulate upload progress
  uploadArea.classList.add('loading');
  
  setTimeout(() => {
    uploadArea.classList.remove('loading');
    uploadArea.classList.add('uploaded');
    uploadArea.innerHTML = `
      <div class="uploaded-file">
        <span>✅</span>
        <span>Đã tải lên / Uploaded</span>
      </div>
    `;

    // Update checkbox
    if (checkbox) {
      checkbox.classList.add('checked');
      checkbox.innerHTML = '✓';
    }
    
    if (documentItem) {
      documentItem.classList.add('completed');
    }

    // Add to uploaded documents
    uploadedDocuments.push(docIndex);

    // Enable submit button if all documents uploaded
    if (uploadedDocuments.length === selectedScenario.documents.length) {
      const submitBtn = document.getElementById('submit-documents');
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Nộp tài liệu / Submit Documents ✓';
        submitBtn.style.backgroundColor = 'var(--vietnam-red)';
        submitBtn.style.cursor = 'pointer';
      }
    }
  }, 1500);
}

function initializeAgents() {
  if (!selectedScenario) return;
  
  // Initialize only agents needed for this scenario
  selectedScenario.agents.forEach(agentId => {
    processingState.agents[agentId] = {
      status: 'waiting',
      progress: 0,
      currentStep: 0,
      timeElapsed: 0
    };
  });
}

function startProcessing() {
  populateProcessingInfo();
  populateAgentsGrid();
  populateProcessingTimeline();
  
  // Start processing simulation
  setTimeout(() => {
    processAgents();
  }, 1000);
}

function populateProcessingInfo() {
  const authorityElement = document.getElementById('processing-authority');
  const timelineElement = document.getElementById('processing-timeline-estimate');
  
  if (authorityElement && selectedScenario) {
    authorityElement.innerHTML = `
      <div class="authority-info">
        <h4>🏛️ Processing Authority</h4>
        <div class="authority-name">${selectedScenario.authority}</div>
        <div class="authority-name-vn">${selectedScenario.authorityVn}</div>
      </div>
    `;
  }
  
  if (timelineElement && selectedScenario) {
    timelineElement.innerHTML = `
      <div class="timeline-info">
        <h4>⏱️ Estimated Timeline</h4>
        <div class="timeline-estimate">${selectedScenario.timeline}</div>
        <div class="timeline-estimate-vn">${selectedScenario.timelineVn}</div>
      </div>
    `;
  }
}

function populateAgentsGrid() {
  const agentsGrid = document.getElementById('agents-grid');
  if (!agentsGrid || !selectedScenario) return;

  // Filter agents based on scenario
  const scenarioAgents = appData.agents.filter(agent => 
    selectedScenario.agents.includes(agent.id)
  );

  agentsGrid.innerHTML = scenarioAgents.map(agent => `
    <div class="agent-card" id="agent-${agent.id}">
      <div class="agent-header">
        <div class="agent-icon">${agent.icon}</div>
        <div class="agent-info">
          <h4>${agent.nameVn}</h4>
          <p>${agent.descriptionVn}</p>
        </div>
      </div>
      <div class="agent-status">
        <div class="status-indicator waiting" id="status-${agent.id}"></div>
        <span class="status-text" id="status-text-${agent.id}">Đang chờ / Waiting</span>
      </div>
      <div class="agent-progress">
        <div class="progress-bar">
          <div class="progress-fill" id="progress-${agent.id}"></div>
        </div>
        <div class="progress-text" id="progress-text-${agent.id}">0%</div>
      </div>
    </div>
  `).join('');
}

function populateProcessingTimeline() {
  const timelineContainer = document.getElementById('processing-timeline');
  if (!timelineContainer || !selectedScenario) return;

  const scenarioAgents = appData.agents.filter(agent => 
    selectedScenario.agents.includes(agent.id)
  );

  timelineContainer.innerHTML = `
    <div class="timeline-line"></div>
    ${scenarioAgents.map((agent, index) => `
      <div class="timeline-item" id="timeline-${agent.id}">
        <div class="timeline-marker" id="timeline-marker-${agent.id}">
          ${index + 1}
        </div>
        <div class="timeline-content">
          <div class="timeline-title">${agent.nameVn}</div>
          <p class="timeline-description">${agent.descriptionVn}</p>
        </div>
      </div>
    `).join('')}
  `;
}

async function processAgents() {
  if (!selectedScenario) return;
  
  const scenarioAgents = appData.agents.filter(agent => 
    selectedScenario.agents.includes(agent.id)
  );
  
  for (let i = 0; i < scenarioAgents.length; i++) {
    const agent = scenarioAgents[i];
    await processAgent(agent);
    updateOverallProgress();
    
    // Add notification
    addNotification(`${agent.nameVn} hoàn thành / ${agent.name} completed`, '✅');
    
    // Update status tracking view
    if (i === scenarioAgents.length - 1) {
      // All agents completed
      setTimeout(() => {
        showView('certificate-delivery');
        populateCompletionInfo();
      }, 2000);
    }
  }
}

function processAgent(agent) {
  return new Promise((resolve) => {
    const agentState = processingState.agents[agent.id];
    agentState.status = 'processing';
    
    // Update UI
    updateAgentUI(agent.id, 'processing');
    updateTimelineUI(agent.id, 'current');
    
    // Simulate processing time based on agent complexity
    const processingTime = getAgentProcessingTime(agent.id);
    const steps = 4; // Each agent has 4 steps
    const stepDuration = processingTime / steps;
    
    let currentStep = 0;
    
    const stepInterval = setInterval(() => {
      // Update progress
      const progress = ((currentStep + 1) / steps) * 100;
      agentState.progress = progress;
      updateAgentProgress(agent.id, progress);
      
      currentStep++;
      
      if (currentStep >= steps) {
        clearInterval(stepInterval);
        
        // Mark as completed
        agentState.status = 'completed';
        updateAgentUI(agent.id, 'completed');
        updateTimelineUI(agent.id, 'completed');
        
        resolve();
      }
    }, stepDuration);
  });
}

function getAgentProcessingTime(agentId) {
  // Different processing times based on agent complexity and scenario
  const baseTimes = {
    'intake': 2000,
    'validation': 3000,
    'extraction': 2500,
    'paternity': 4000,
    'dna': 6000,
    'embassy': 5000,
    'nationality': 3500,
    'late': 4500,
    'verification': 3000,
    'approval': 2500,
    'generation': 2000
  };
  
  return baseTimes[agentId] || 3000;
}

function updateAgentUI(agentId, status) {
  const card = document.getElementById(`agent-${agentId}`);
  const indicator = document.getElementById(`status-${agentId}`);
  const statusText = document.getElementById(`status-text-${agentId}`);
  
  if (card) card.className = `agent-card ${status}`;
  if (indicator) indicator.className = `status-indicator ${status}`;
  
  const statusTexts = {
    waiting: 'Đang chờ / Waiting',
    processing: 'Đang xử lý / Processing',
    completed: 'Hoàn thành / Completed'
  };
  
  if (statusText) statusText.textContent = statusTexts[status];
}

function updateAgentProgress(agentId, progress) {
  const progressFill = document.getElementById(`progress-${agentId}`);
  const progressText = document.getElementById(`progress-text-${agentId}`);
  
  if (progressFill) progressFill.style.width = `${progress}%`;
  if (progressText) progressText.textContent = `${Math.round(progress)}%`;
}

function updateTimelineUI(agentId, status) {
  const marker = document.getElementById(`timeline-marker-${agentId}`);
  
  if (marker) {
    marker.className = `timeline-marker ${status}`;
    
    if (status === 'completed') {
      marker.innerHTML = '✓';
    }
  }
}

function updateOverallProgress() {
  if (!selectedScenario) return;
  
  const completedAgents = Object.values(processingState.agents).filter(agent => agent.status === 'completed').length;
  const totalAgents = selectedScenario.agents.length;
  const progress = (completedAgents / totalAgents) * 100;
  
  processingState.overallProgress = progress;
  
  const progressFill = document.getElementById('overall-progress');
  const progressText = document.getElementById('overall-progress-text');
  
  if (progressFill) {
    progressFill.style.width = `${progress}%`;
  }
  
  if (progressText) {
    progressText.textContent = `${Math.round(progress)}%`;
  }
  
  // Update time remaining based on scenario timeline
  const timeRemaining = calculateTimeRemaining(progress);
  processingState.timeRemaining = timeRemaining;
  
  const timeRemainingEl = document.getElementById('time-remaining');
  if (timeRemainingEl) {
    timeRemainingEl.textContent = `Thời gian còn lại: ${formatTime(Math.round(timeRemaining))}`;
  }
}

function calculateTimeRemaining(progress) {
  if (!selectedScenario) return 0;
  
  // Convert scenario timeline to minutes for estimation
  const timelineMap = {
    'Same day': 60,
    '1-2 working days': 120,
    '1-3 working days': 180,
    '3-15 working days': 600,
    '15 working days': 900
  };
  
  const totalTime = timelineMap[selectedScenario.timeline] || 60;
  return Math.max(0, totalTime - (progress / 100 * totalTime));
}

function addNotification(message, icon) {
  const notification = {
    id: Date.now(),
    message,
    icon,
    timestamp: new Date().toLocaleTimeString('vi-VN')
  };
  
  processingState.notifications.unshift(notification);
  updateNotificationsUI();
}

function updateNotificationsUI() {
  const notificationsList = document.getElementById('notifications-list');
  if (!notificationsList) return;
  
  notificationsList.innerHTML = processingState.notifications.map(notification => `
    <div class="notification-item">
      <div class="notification-icon">${notification.icon}</div>
      <div class="notification-content">
        <div class="notification-title">${notification.message}</div>
        <div class="notification-time">${notification.timestamp}</div>
      </div>
    </div>
  `).join('');
}

function populateCompletionInfo() {
  const completionInfo = document.getElementById('scenario-completion-info');
  if (!completionInfo || !selectedScenario) return;
  
  // Generate scenario-specific next steps
  const nextSteps = generateNextSteps(selectedScenario);
  
  completionInfo.innerHTML = `
    <h3 class="completion-scenario-title">
      ✅ Completed: ${selectedScenario.nameVn}
    </h3>
    <div class="next-steps">
      <h4>Các bước tiếp theo / Next Steps:</h4>
      ${nextSteps.map(step => `
        <div class="next-step-item">
          <span>•</span>
          <span>${step}</span>
        </div>
      `).join('')}
    </div>
  `;
}

function generateNextSteps(scenario) {
  const commonSteps = [
    'Tải về bản giấy khai sinh số / Download digital birth certificate',
    'Lưu mã tham chiếu để tra cứu sau / Save reference code for future lookup'
  ];
  
  const scenarioSpecificSteps = {
    'married_vn_foreign': [
      'Liên hệ đại sứ quán để xác nhận quốc tịch / Contact embassy to confirm nationality',
      'Cập nhật thông tin với cơ quan ngoại giao / Update information with diplomatic office'
    ],
    'unmarried_vn_foreign': [
      'Theo dõi quy trình xác minh ADN / Monitor DNA verification process',
      'Hoàn thiện thủ tục quốc tịch / Complete nationality procedures'
    ],
    'late_registration': [
      'Nộp phí trễ hạn (nếu có) / Pay late registration fee (if applicable)',
      'Cập nhật hồ sơ với ủy ban phường/xã / Update records with ward committee'
    ]
  };
  
  return [...commonSteps, ...(scenarioSpecificSteps[scenario.id] || [])];
}

function resetApplication() {
  // Reset state
  selectedScenario = null;
  assessmentAnswers = {};
  uploadedDocuments = [];
  processingState = {
    overallProgress: 0,
    agents: {},
    notifications: [],
    timeRemaining: 60
  };
  
  // Reset UI
  const submitBtn = document.getElementById('submit-documents');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Nộp tài liệu / Submit Documents';
    submitBtn.style.backgroundColor = '';
    submitBtn.style.cursor = '';
  }
}

// Status tracking functionality
function updateStatusTracking() {
  const statusBadge = document.getElementById('status-badge');
  const statusDescription = document.getElementById('status-description');
  
  let status = 'processing';
  let description = 'Hệ thống AI đang xử lý tài liệu của bạn...';
  
  if (!selectedScenario) return;
  
  const completedAgents = Object.values(processingState.agents).filter(agent => agent.status === 'completed').length;
  const totalAgents = selectedScenario.agents.length;
  
  if (completedAgents === totalAgents) {
    status = 'completed';
    description = 'Xử lý hoàn tất! Giấy khai sinh đã được tạo thành công.';
  } else if (completedAgents > 0) {
    status = 'processing';
    description = `Đã hoàn thành ${completedAgents}/${totalAgents} bước xử lý cho trường hợp: ${selectedScenario.nameVn}`;
  }
  
  if (statusBadge) {
    statusBadge.className = `status status--${status === 'completed' ? 'success' : 'info'}`;
    statusBadge.textContent = status === 'completed' ? 'Hoàn thành / Completed' : 'Đang xử lý / Processing';
  }
  
  if (statusDescription) {
    statusDescription.textContent = description;
  }
}

// Main initialization
function initApp() {
  // Ensure DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupApp);
  } else {
    setupApp();
  }
}

function setupApp() {
  setupEventListeners();
  populateScenariosOverview();
}

// Initialize the app
initApp();

// Periodic updates for status tracking
setInterval(() => {
  if (currentView === 'status-tracking') {
    updateStatusTracking();
  }
}, 1000);