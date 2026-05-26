"""Scenario data for SpeakUp."""

SCENARIOS = {
	"speaking": {
		"name": "Speaking Skills",
		"difficulty": "Beginner",
		"description": "Everyday conversational English. Low pressure, short prompts.",
		"icon": "mic",
		"color": "#00eaff",
		"scenarios": [
			{
				"id": "s1",
				"title": "Self Introduction",
				"prompt": "Introduce yourself in 60 seconds. Cover your name, background, and one interesting fact about yourself.",
				"time_limit": 60,
				"difficulty": "Easy",
				"tips": ["Speak clearly", "Smile while speaking", "Maintain good posture"],
			},
			{
				"id": "s2",
				"title": "Opinion",
				"prompt": "Share your opinion on a simple topic (e.g., online learning). Give one reason and a short example.",
				"time_limit": 60,
				"difficulty": "Easy",
				"tips": ["State your opinion early", "Use one strong reason", "Keep it simple"],
			},
			{
				"id": "s3",
				"title": "Describe",
				"prompt": "Describe a place you enjoy. Mention what it looks like, how it feels, and why you like it.",
				"time_limit": 60,
				"difficulty": "Easy",
				"tips": ["Use sensory details", "Organize your points", "Speak at a steady pace"],
			},
			{
				"id": "s4",
				"title": "Daily Life",
				"prompt": "Explain your daily routine from morning to evening in 60 seconds.",
				"time_limit": 60,
				"difficulty": "Easy",
				"tips": ["Use time markers", "Keep sentences short", "Stay on topic"],
			},
			{
				"id": "s5",
				"title": "Favourite Thing",
				"prompt": "Talk about your favorite thing (book, movie, food, or hobby). Explain why you like it.",
				"time_limit": 60,
				"difficulty": "Easy",
				"tips": ["Give one clear reason", "Add a personal detail", "End with a summary"],
			},
		],
	},
	"public_speaking": {
		"name": "Public Speaking",
		"difficulty": "Intermediate",
		"description": "Speak with confidence for a group. Longer responses and stronger structure.",
		"icon": "megaphone",
		"color": "#ffb703",
		"scenarios": [
			{
				"id": "p1",
				"title": "Impromptu",
				"prompt": "You are given a surprise topic: 'The value of failure.' Speak for 90 seconds.",
				"time_limit": 90,
				"difficulty": "Medium",
				"tips": ["Use a quick 3-part structure", "Pause before you start", "Finish with a takeaway"],
			},
			{
				"id": "p2",
				"title": "Motivational",
				"prompt": "Deliver a short motivational speech encouraging students to pursue their goals.",
				"time_limit": 90,
				"difficulty": "Medium",
				"tips": ["Use positive language", "Include a short story", "End with a call to action"],
			},
			{
				"id": "p3",
				"title": "Debate",
				"prompt": "Argue for or against the topic: 'Remote work is better than office work.'",
				"time_limit": 90,
				"difficulty": "Medium",
				"tips": ["State your stance clearly", "Give two reasons", "Address the other side briefly"],
			},
			{
				"id": "p4",
				"title": "Story",
				"prompt": "Tell a short story about a challenge you faced and what you learned.",
				"time_limit": 90,
				"difficulty": "Medium",
				"tips": ["Set the scene quickly", "Highlight the turning point", "End with the lesson"],
			},
			{
				"id": "p5",
				"title": "Current Affairs",
				"prompt": "Summarize a recent news topic and explain why it matters.",
				"time_limit": 90,
				"difficulty": "Medium",
				"tips": ["Stay neutral", "Explain impact", "Keep it concise"],
			},
		],
	},
	"presentation": {
		"name": "Presentation Skills",
		"difficulty": "Advanced",
		"description": "Structured presentations with clarity, logic, and persuasive delivery.",
		"icon": "presentation",
		"color": "#7cff6b",
		"scenarios": [
			{
				"id": "r1",
				"title": "Concept Explain",
				"prompt": "Explain a complex concept (e.g., blockchain or photosynthesis) to a beginner.",
				"time_limit": 120,
				"difficulty": "Hard",
				"tips": ["Define key terms", "Use an analogy", "Check for clarity"],
			},
			{
				"id": "r2",
				"title": "Product Pitch",
				"prompt": "Pitch a new product idea to a potential investor in two minutes.",
				"time_limit": 120,
				"difficulty": "Hard",
				"tips": ["Start with the problem", "Highlight benefits", "End with a clear ask"],
			},
			{
				"id": "r3",
				"title": "Project Present",
				"prompt": "Present a project you worked on. Cover goal, process, and results.",
				"time_limit": 120,
				"difficulty": "Hard",
				"tips": ["Use a clear structure", "Share one metric", "Keep transitions smooth"],
			},
			{
				"id": "r4",
				"title": "Problem Solution",
				"prompt": "Describe a real-world problem and propose a practical solution.",
				"time_limit": 120,
				"difficulty": "Hard",
				"tips": ["Define the problem", "Explain your solution", "Mention impact"],
			},
			{
				"id": "r5",
				"title": "Data Explain",
				"prompt": "Explain a data trend from a simple chart (e.g., sales growth). Focus on insights.",
				"time_limit": 120,
				"difficulty": "Hard",
				"tips": ["Describe the trend", "Explain the cause", "State the implication"],
			},
		],
	},
}


def get_scenario(category, scenario_id):
	"""Returns a specific scenario dict or None if not found."""
	category_data = SCENARIOS.get(category)
	if not category_data:
		return None

	for scenario in category_data.get("scenarios", []):
		if scenario.get("id") == scenario_id:
			return scenario
	return None


def get_category(category):
	"""Returns a category dict or None if not found."""
	return SCENARIOS.get(category)
