import type { Scenario, Agent, AssessmentQuestion } from "./types";

export const scenarios: Scenario[] = [
	{
		id: "married_vn_vn",
		name: "Married Vietnamese Parents",
		nameVn: "Cha mẹ Việt Nam đã kết hôn",
		authority: "Commune-level People's Committee",
		authorityVn: "Ủy ban nhân dân cấp xã",
		timeline: "Same day",
		timelineVn: "Trong ngày",
		complexity: "Low",
		complexityVn: "Đơn giản",
		agents: ["intake", "validation", "extraction", "verification", "approval", "generation"],
		documents: [
			{ name: "Birth declaration form", nameVn: "Tờ khai đăng ký khai sinh", required: true },
			{ name: "Marriage certificate", nameVn: "Giấy chứng nhận kết hôn", required: true },
			{ name: "Parents' ID cards", nameVn: "CMND/CCCD của cha mẹ", required: true },
			{ name: "Hospital birth certificate", nameVn: "Giấy chứng sinh", required: true }
		]
	},
	{
		id: "married_vn_foreign",
		name: "Married Vietnamese + Foreign Parent",
		nameVn: "Cha mẹ đã kết hôn (một người Việt Nam, một người nước ngoài)",
		authority: "Provincial Department of Justice",
		authorityVn: "Sở Tư pháp cấp tỉnh",
		timeline: "1-3 working days",
		timelineVn: "1-3 ngày làm việc",
		complexity: "Medium",
		complexityVn: "Trung bình",
		agents: ["intake", "validation", "extraction", "embassy", "nationality", "verification", "approval", "generation"],
		documents: [
			{ name: "Birth declaration form", nameVn: "Tờ khai đăng ký khai sinh", required: true },
			{ name: "Marriage certificate", nameVn: "Giấy chứng nhận kết hôn", required: true },
			{ name: "Vietnamese parent's ID", nameVn: "CMND/CCCD của cha/mẹ Việt Nam", required: true },
			{ name: "Foreign parent's passport", nameVn: "Hộ chiếu của cha/mẹ nước ngoài", required: true },
			{ name: "Hospital birth certificate", nameVn: "Giấy chứng sinh", required: true },
			{ name: "Nationality agreement", nameVn: "Thỏa thuận về quốc tịch cho trẻ", required: true },
			{ name: "Embassy authentication documents", nameVn: "Giấy tờ xác thực từ đại sứ quán", required: true }
		]
	},
	{
		id: "unmarried_vn_vn",
		name: "Unmarried Vietnamese Parents",
		nameVn: "Cha mẹ Việt Nam chưa kết hôn",
		authority: "District-level People's Committee",
		authorityVn: "Ủy ban nhân dân cấp huyện",
		timeline: "1-2 working days",
		timelineVn: "1-2 ngày làm việc",
		complexity: "Medium",
		complexityVn: "Trung bình",
		agents: ["intake", "validation", "extraction", "paternity", "verification", "approval", "generation"],
		documents: [
			{ name: "Birth declaration form", nameVn: "Tờ khai đăng ký khai sinh", required: true },
			{ name: "Parents' ID cards", nameVn: "CMND/CCCD của cha mẹ", required: true },
			{ name: "Hospital birth certificate", nameVn: "Giấy chứng sinh", required: true },
			{ name: "Paternity recognition form", nameVn: "Đơn xác nhận cha con", required: true },
			{ name: "Witness statements (2 people)", nameVn: "Lời khai của nhân chứng (2 người)", required: true }
		]
	},
	{
		id: "unmarried_vn_foreign",
		name: "Unmarried Vietnamese + Foreign Parent",
		nameVn: "Cha mẹ chưa kết hôn (một người Việt Nam, một người nước ngoài)",
		authority: "Provincial Department of Justice",
		authorityVn: "Sở Tư pháp cấp tỉnh",
		timeline: "15 working days",
		timelineVn: "15 ngày làm việc",
		complexity: "High",
		complexityVn: "Phức tạp",
		agents: ["intake", "validation", "extraction", "paternity", "dna", "embassy", "nationality", "verification", "approval", "generation"],
		documents: [
			{ name: "Birth declaration form", nameVn: "Tờ khai đăng ký khai sinh", required: true },
			{ name: "Vietnamese parent's ID", nameVn: "CMND/CCCD của cha/mẹ Việt Nam", required: true },
			{ name: "Foreign parent's passport", nameVn: "Hộ chiếu của cha/mẹ nước ngoài", required: true },
			{ name: "Hospital birth certificate", nameVn: "Giấy chứng sinh", required: true },
			{ name: "Paternity recognition form", nameVn: "Đơn xác nhận cha con", required: true },
			{ name: "DNA test results", nameVn: "Kết quả xét nghiệm ADN", required: true },
			{ name: "Embassy authentication documents", nameVn: "Giấy tờ xác thực từ đại sứ quán", required: true },
			{ name: "Nationality agreement", nameVn: "Thỏa thuận về quốc tịch cho trẻ", required: true },
			{ name: "Witness statements (2 people)", nameVn: "Lời khai của nhân chứng (2 người)", required: true }
		]
	},
	{
		id: "single_parent",
		name: "Single Parent Registration",
		nameVn: "Đăng ký một phụ huynh",
		authority: "Commune-level People's Committee",
		authorityVn: "Ủy ban nhân dân cấp xã",
		timeline: "Same day",
		timelineVn: "Trong ngày",
		complexity: "Low",
		complexityVn: "Đơn giản",
		agents: ["intake", "validation", "extraction", "verification", "approval", "generation"],
		documents: [
			{ name: "Birth declaration form", nameVn: "Tờ khai đăng ký khai sinh", required: true },
			{ name: "Mother's ID card", nameVn: "CMND/CCCD của mẹ", required: true },
			{ name: "Hospital birth certificate", nameVn: "Giấy chứng sinh", required: true }
		]
	},
	{
		id: "late_registration",
		name: "Late Registration (>60 days)",
		nameVn: "Đăng ký trễ hạn (>60 ngày)",
		authority: "Varies by case",
		authorityVn: "Tùy theo từng trường hợp",
		timeline: "3-15 working days",
		timelineVn: "3-15 ngày làm việc",
		complexity: "High",
		complexityVn: "Phức tạp",
		agents: ["intake", "validation", "extraction", "late", "verification", "approval", "generation"],
		documents: [
			{ name: "All standard documents for scenario", nameVn: "Tất cả giấy tờ theo từng trường hợp", required: true },
			{ name: "Explanation letter for delay", nameVn: "Đơn giải thích lý do trễ hạn", required: true },
			{ name: "Ward committee confirmation", nameVn: "Giấy xác nhận từ UBND phường/xã", required: true },
			{ name: "Additional witness statements", nameVn: "Lời khai bổ sung của nhân chứng", required: false }
		]
	}
];

export const agents: Agent[] = [
	{
		id: "intake",
		name: "Document Intake Agent",
		nameVn: "Agent Tiếp Nhận Hồ Sơ",
		icon: "📥",
		description: "Receives and classifies documents",
		descriptionVn: "Tiếp nhận và phân loại hồ sơ"
	},
	{
		id: "validation",
		name: "Validation Agent",
		nameVn: "Agent Xác Thực",
		icon: "✅",
		description: "Verifies document authenticity",
		descriptionVn: "Xác thực tính hợp lệ của giấy tờ"
	},
	{
		id: "extraction",
		name: "Data Extraction Agent",
		nameVn: "Agent Trích Xuất Dữ Liệu",
		icon: "🔍",
		description: "Extracts information using OCR/NLP",
		descriptionVn: "Trích xuất thông tin bằng OCR/NLP"
	},
	{
		id: "paternity",
		name: "Paternity Recognition Agent",
		nameVn: "Agent Xác Nhận Cha Con",
		icon: "👨‍👧‍👦",
		description: "Handles paternity acknowledgment",
		descriptionVn: "Xử lý xác nhận quan hệ cha con"
	},
	{
		id: "dna",
		name: "DNA Verification Agent",
		nameVn: "Agent Xác Minh ADN",
		icon: "🧬",
		description: "Manages DNA test verification",
		descriptionVn: "Quản lý xác minh xét nghiệm ADN"
	},
	{
		id: "embassy",
		name: "Embassy Document Agent",
		nameVn: "Agent Giấy Tờ Đại Sứ Quán",
		icon: "🏛️",
		description: "Handles foreign document authentication",
		descriptionVn: "Xử lý xác thực giấy tờ nước ngoài"
	},
	{
		id: "nationality",
		name: "Nationality Agreement Agent",
		nameVn: "Agent Thỏa Thuận Quốc Tịch",
		icon: "🌍",
		description: "Processes nationality selection",
		descriptionVn: "Xử lý lựa chọn quốc tịch"
	},
	{
		id: "late",
		name: "Late Registration Agent",
		nameVn: "Agent Đăng Ký Trễ Hạn",
		icon: "⏰",
		description: "Handles delayed registration requirements",
		descriptionVn: "Xử lý yêu cầu đăng ký trễ hạn"
	},
	{
		id: "verification",
		name: "Database Verification Agent",
		nameVn: "Agent Xác Minh Cơ Sở Dữ Liệu",
		icon: "🔄",
		description: "Cross-checks with databases",
		descriptionVn: "Kiểm tra chéo với cơ sở dữ liệu"
	},
	{
		id: "approval",
		name: "Approval Agent",
		nameVn: "Agent Phê Duyệt",
		icon: "👥",
		description: "Final review and approval",
		descriptionVn: "Xem xét và phê duyệt cuối cùng"
	},
	{
		id: "generation",
		name: "Certificate Generation Agent",
		nameVn: "Agent Tạo Giấy Chứng Nhận",
		icon: "📄",
		description: "Creates birth certificate",
		descriptionVn: "Tạo giấy khai sinh"
	}
];

export const assessmentQuestions: AssessmentQuestion[] = [
	{
		id: "married",
		question: "Are the parents legally married?",
		questionVn: "Cha mẹ đã đăng ký kết hôn chưa?",
		options: [
			{ value: "yes", text: "Yes", textVn: "Có" },
			{ value: "no", text: "No", textVn: "Không" }
		]
	},
	{
		id: "foreign",
		question: "Is either parent a foreign national?",
		questionVn: "Có cha hoặc mẹ nào là người nước ngoài không?",
		options: [
			{ value: "yes", text: "Yes", textVn: "Có" },
			{ value: "no", text: "No", textVn: "Không" }
		]
	},
	{
		id: "timing",
		question: "Is this registration being done within 60 days of birth?",
		questionVn: "Việc đăng ký có được thực hiện trong vòng 60 ngày sau sinh không?",
		options: [
			{ value: "yes", text: "Yes", textVn: "Có" },
			{ value: "no", text: "No", textVn: "Không" }
		]
	},
	{
		id: "paternity",
		question: "Do you need paternity recognition? (for unmarried parents)",
		questionVn: "Có cần xác nhận quan hệ cha con không? (đối với cha mẹ chưa kết hôn)",
		options: [
			{ value: "yes", text: "Yes", textVn: "Có" },
			{ value: "no", text: "No", textVn: "Không" },
			{ value: "na", text: "Not applicable", textVn: "Không áp dụng" }
		]
	},
	{
		id: "father_present",
		question: "Is the father present and willing to be listed on the birth certificate?",
		questionVn: "Cha có mặt và sẵn sàng được ghi tên trên giấy khai sinh không?",
		options: [
			{ value: "yes", text: "Yes", textVn: "Có" },
			{ value: "no", text: "No", textVn: "Không" }
		]
	}
];

export const complexityColors = {
	Low: "bg-green-100 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800",
	Medium: "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-300 dark:border-yellow-800",
	High: "bg-red-100 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800"
} as const;

export const routingBenefits = [
	{
		icon: "🎯",
		title: "Tự động xác định trường hợp",
		titleEn: "Automatic case determination",
		description: "AI phân tích tình huống và chọn quy trình phù hợp nhất",
		descriptionEn: "AI analyzes the situation and selects the most appropriate process"
	},
	{
		icon: "📋",
		title: "Danh sách tài liệu chính xác",
		titleEn: "Accurate document list",
		description: "Chỉ yêu cầu đúng những giấy tờ cần thiết cho trường hợp của bạn",
		descriptionEn: "Only requests the exact documents needed for your case"
	},
	{
		icon: "🏛️",
		title: "Định tuyến cơ quan đúng",
		titleEn: "Correct authority routing",
		description: "Tự động chuyển hồ sơ đến cấp xử lý thích hợp",
		descriptionEn: "Automatically routes files to the appropriate processing level"
	},
	{
		icon: "⏱️",
		title: "Thời gian xử lý tối ưu",
		titleEn: "Optimized processing time",
		description: "Ước tính chính xác thời gian dựa trên độ phức tạp",
		descriptionEn: "Accurate time estimates based on complexity"
	}
];
