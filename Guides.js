document.getElementById("computePlan").addEventListener("click", computePlan);
document.getElementById("computeCost").addEventListener("click", computeCost);
document.getElementById("computeOptimalPlan").addEventListener("click", computeOptimalPlan);

const supply = [0, 0, 0];
const demand = [0, 0, 0, 0];
const costs = Array.from({ length: 3 }, () => Array(4).fill(0));
let plan = Array.from({ length: 3 }, () => Array(4).fill(0));

// Helper function to deep copy a matrix
function deepCopyMatrix(matrix) {
  return matrix.map(row => [...row]);
}

// Collect supply, demand, and costs
function gatherInputs() {
  document.querySelectorAll(".supply").forEach((input, index) => {
    supply[index] = parseInt(input.value) || 0;
  });

  document.querySelectorAll(".demand").forEach((input, index) => {
    demand[index] = parseInt(input.value) || 0;
  });

  document.querySelectorAll(".cost").forEach((input) => {
    const row = parseInt(input.dataset.row);
    const col = parseInt(input.dataset.col);
    costs[row][col] = parseInt(input.value) || 0;
  });
}

// Compute transportation plan using Northwest Corner Method
function computePlan() {
  gatherInputs();
  let remainingSupply = [...supply];
  let remainingDemand = [...demand];
  plan = Array.from({ length: 3 }, () => Array(4).fill(0)); // Reset the plan

  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 4; j++) {
      if (remainingSupply[i] > 0 && remainingDemand[j] > 0) {
        const allocation = Math.min(remainingSupply[i], remainingDemand[j]);
        plan[i][j] = allocation;
        remainingSupply[i] -= allocation;
        remainingDemand[j] -= allocation;
      }
    }
  }

  updatePlanTable();
}

// Update the transportation plan table
function updatePlanTable() {
  plan.forEach((row, i) => {
    row.forEach((value, j) => {
      document.getElementById(`optimal-plan-${i}-${j}`).textContent = value;
    });
  });
}

// Compute total supply and demand, check for balance, and display results
function computeTotalSupplyAndDemand() {
  const totalSupply = supply.reduce((acc, val) => acc + val, 0);
  const totalDemand = demand.reduce((acc, val) => acc + val, 0);

  document.getElementById("totalSupply").textContent = totalSupply;
  document.getElementById("totalDemand").textContent = totalDemand;

  if (totalSupply !== totalDemand) {
    alert("Supply and demand are not balanced!");
    return { balanced: false };
  }

  return { balanced: true };
}

// Compute total cost and display supply/demand totals
function computeCost() {
  let totalCost = 0;

  plan.forEach((row, i) => {
    row.forEach((value, j) => {
      totalCost += value * costs[i][j];
    });
  });

  const { balanced } = computeTotalSupplyAndDemand();

  if (balanced) {
    document.getElementById("totalCost").textContent = `${totalCost}`;
  } else {
    document.getElementById("totalCost").textContent = "0";
  }
}

// Compute the reduced costs using the Stepping Stone method
function computeOptimalPlan() {
  const { balanced } = computeTotalSupplyAndDemand();

  if (!balanced) {
    alert("Cannot compute the optimal plan as supply and demand are not balanced!");
    return;
  }

  // Clone the current plan for calculations
  const tempPlan = deepCopyMatrix(plan);
  let improvementFound = false;

  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 4; j++) {
      if (tempPlan[i][j] === 0) {
        const reducedCost = calculateReducedCost(i, j, tempPlan);
        if (reducedCost < 0) {
          improvementFound = true;
          updateTransportationPlan(tempPlan, i, j); // Pass the cloned plan
        }
      }
    }
  }

  if (improvementFound) {
    plan = deepCopyMatrix(tempPlan); // Update the actual plan
    updatePlanTable();
    computeCost(); // Recompute the cost with the optimal plan
  } else {
    alert("The transportation plan is already optimal.");
  }
}

// Helper function to calculate the reduced cost for a specific unoccupied cell
function calculateReducedCost(row, col, currentPlan) {
  const loop = findClosedLoop(row, col, currentPlan);
  if (!loop) return Number.MAX_VALUE; // No valid loop; penalize heavily

  // Compute the opportunity cost using the loop
  let opportunityCost = 0;
  let add = true;

  loop.forEach(([r, c]) => {
    opportunityCost += add ? costs[r][c] : -costs[r][c];
    add = !add;
  });

  return opportunityCost;
}

// Find a closed loop for the Stepping Stone method
function findClosedLoop(row, col, currentPlan) {
  // Simplified example logic for now; replace with full loop-finding logic
  return [[row, col]]; // This needs to be replaced with actual loop-finding logic
}

// Helper function to update the transportation plan for a specific cell
function updateTransportationPlan(tempPlan, row, col) {
  const loop = findClosedLoop(row, col, tempPlan);

  if (!loop) {
    console.error("No valid loop found!");
    return;
  }

  // Identify the minimum allocation in the loop (among allocated cells only)
  let minAllocation = Infinity;

  loop.forEach(([r, c]) => {
    if (tempPlan[r][c] > 0) {
      minAllocation = Math.min(minAllocation, tempPlan[r][c]);
    }
  });

  // Update the allocations along the loop
  let add = true;
  loop.forEach(([r, c]) => {
    if (add) {
      tempPlan[r][c] += minAllocation;
    } else {
      tempPlan[r][c] -= minAllocation;
    }
    add = !add;
  });
}
