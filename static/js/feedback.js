// feedback.js
// ---------------------------------------------------------------------------
// Handles dynamic behaviors on the Feedback page.
// ---------------------------------------------------------------------------

const getScoreClass = (score) => {
	if (score <= 4) {
		return "score-low";
	}
	if (score <= 7) {
		return "score-mid";
	}
	return "score-high";
};

const animateScore = (element, targetScore) => {
	let current = 0;
	const step = Math.max(1, Math.ceil(targetScore / 30));

	const timer = setInterval(() => {
		current += step;
		if (current >= targetScore) {
			current = targetScore;
			clearInterval(timer);
		}
		element.textContent = current;
	}, 25);
};

const overallScore = document.getElementById("overall-score");
if (overallScore) {
	const scoreValue = Number(overallScore.dataset.score || 0);
	const scoreText = overallScore.querySelector(".su-score-value");
	overallScore.classList.add(getScoreClass(scoreValue));
	if (scoreText) {
		animateScore(scoreText, scoreValue);
	}
}

const parameterCards = document.querySelectorAll(".su-parameter-card");
parameterCards.forEach((card) => {
	const scoreValue = Number(card.dataset.score || 0);
	card.classList.add(getScoreClass(scoreValue));

	card.addEventListener("click", () => {
		card.classList.toggle("is-expanded");
	});
});

const wpmValue = document.getElementById("wpm-value");
const wpmFill = document.getElementById("wpm-fill");
if (wpmValue && wpmFill) {
	const wpm = Number(wpmValue.dataset.wpm || 0);
	const normalized = Math.min(200, wpm);
	const percent = Math.max(5, Math.round((normalized / 200) * 100));
	wpmFill.style.width = `${percent}%`;
}
