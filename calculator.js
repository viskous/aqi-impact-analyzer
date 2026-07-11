let impactChart;

function calculateImpact() {

    const carKm = parseFloat(document.getElementById("carKm").value) || 0;
    const publicKm = parseFloat(document.getElementById("publicKm").value) || 0;
    const flightHours = parseFloat(document.getElementById("flightHours").value) || 0;
    const electricity = parseFloat(document.getElementById("electricity").value) || 0;
    const lpg = parseFloat(document.getElementById("lpg").value) || 0;

    // Annual CO2 Emissions (approximate scientific averages)
    const carCO2 = carKm * 12 * 0.21;
    const publicCO2 = publicKm * 12 * 0.05;
    const flightCO2 = flightHours * 90;
    const electricityCO2 = electricity * 12 * 0.82;
    const lpgCO2 = lpg * 42;

    const total = carCO2 + publicCO2 + flightCO2 + electricityCO2 + lpgCO2;

    // Show results properly (grid layout)
    document.getElementById("results").style.display = "grid";

    const ctx = document.getElementById("impactChart").getContext("2d");

    if (impactChart) impactChart.destroy();

    impactChart = new Chart(ctx, {
        type: "doughnut",
        data: {
            labels: ["Car", "Public Transport", "Flights", "Electricity", "Cooking"],
            datasets: [{
                data: [carCO2, publicCO2, flightCO2, electricityCO2, lpgCO2]
            }]
        },
        options: {
            responsive: true
        }
    });

    let level = "";
    if (total < 2000) level = "Low Impact 🟢";
    else if (total < 5000) level = "Moderate Impact 🟡";
    else level = "High Impact 🔴";

    document.getElementById("analysisText").innerHTML =
        "<strong>Total Annual CO₂ Emissions:</strong> " + total.toFixed(2) + " kg<br><br>" +
        "<strong>Impact Level:</strong> " + level + "<br><br>" +
        "<strong>Recommendations:</strong><br>" +
        "• Reduce car travel<br>" +
        "• Use renewable electricity<br>" +
        "• Limit flight travel<br>" +
        "• Improve home energy efficiency";
}