/**
 * All 10 Progressive Levels Configuration
 * Categorized into 3 Stages with Validated Rules and Lateral Thinking Elements
 */

export const LEVELS = [
  // =========================================================================
  // STAGE 1 — WARM-UP
  // =========================================================================
  {
    id: 1,
    stage: 1,
    stageName: "Stage 1 — Warm-up",
    difficulty: "Easy",
    title: "The Nine-Dot Classic",
    subtitle: "The origin of 'Thinking Outside the Box'",
    type: "nine-dot",
    timeLimit: 120,
    requiredLines: 4,
    objective: "Connect all nine dots using exactly four straight lines.",
    rules: [
      "Connect all nine dots.",
      "Draw exactly four straight, connected line segments.",
      "Never lift the pen between segments.",
      "You may extend your lines beyond the outer dots.",
      "Complete the puzzle before the timer expires."
    ],
    authorTip: "Question your unconscious geometric assumptions. Is the boundary really a wall?",
    hints: [
      "Do not assume the lines must stay inside the square formed by the dots.",
      "Your lines can extend beyond the outermost dots into the surrounding space.",
      "Think about where your line starts and ends, not just which dots it passes through."
    ],
    solutionDescription: "Start at a corner dot (or beyond it). Draw diagonally and straight outward past the grid boundary, turning at external intersection points so 4 lines slice all 9 dots."
  },
  {
    id: 2,
    stage: 1,
    stageName: "Stage 1 — Warm-up",
    difficulty: "Easy",
    title: "The Triangle Envelope",
    subtitle: "Connect five key nodes with three continuous strokes",
    type: "three-lines",
    timeLimit: 120,
    requiredLines: 3,
    objective: "Connect all five dots using exactly three continuous straight lines.",
    rules: [
      "Connect all five dots.",
      "Use exactly three straight, connected segments without lifting the pen.",
      "Lines can extend outside the dots.",
      "All dots must be touched."
    ],
    authorTip: "A closed triangle has 3 sides. Can an external apex slice through the center?",
    hints: [
      "Notice how the dots form an apex with a base.",
      "A large enclosing triangle starting well outside can cover multiple dots per edge.",
      "Start outside the bottom, shoot past the top apex, and cut diagonally back through the base."
    ],
    solutionDescription: "Start below the bottom-left dot, draw up past the apex, turn sharply diagonally through the right and center, then close back through the bottom."
  },
  {
    id: 3,
    stage: 1,
    stageName: "Stage 1 — Warm-up",
    difficulty: "Medium",
    title: "Continuous Star Flow",
    subtitle: "Trace the envelope network in one continuous breath",
    type: "minimal-star",
    timeLimit: 90,
    requiredLines: 8,
    objective: "Trace every edge of the envelope graph in a single continuous stroke without retracing any edge.",
    rules: [
      "Trace all 8 edges of the envelope house.",
      "Do not retrace any edge twice.",
      "Stroke must be continuous from start to finish.",
      "Choose your starting node wisely (Eulerian graph principle)."
    ],
    authorTip: "Count the number of edges meeting at each corner. Odd-degree vertices are special!",
    hints: [
      "Only two nodes have an odd number of connections (the two bottom corners).",
      "An Eulerian path MUST start at one odd vertex and finish at the other.",
      "Start at bottom-left or bottom-right, do the inner diagonals, roof, and finish at the opposite base."
    ],
    solutionDescription: "Start at bottom-left, traverse up to top-left, roof apex, top-right, down to bottom-left, across to bottom-right, diagonal to top-left, horizontal to top-right, down to bottom-right."
  },

  // =========================================================================
  // STAGE 2 — THINK DIFFERENTLY
  // =========================================================================
  {
    id: 4,
    stage: 2,
    stageName: "Stage 2 — Think Differently",
    difficulty: "Medium",
    title: "Matchstick Lateral Math",
    subtitle: "Fix the broken equality: 6 + 4 = 4",
    type: "matchstick",
    timeLimit: 120,
    requiredMoves: 1,
    objective: "Move exactly ONE matchstick to make the mathematical equation true.",
    rules: [
      "Current equation reads: 6 + 4 = 4.",
      "You must move exactly ONE matchstick.",
      "Place it into a valid matchstick segment position.",
      "The resulting equation must be mathematically correct."
    ],
    authorTip: "Don't just alter numbers; symbols are made of sticks too!",
    hints: [
      "Look at the plus sign '+' and the first digit '6'.",
      "If you take the vertical stick from '+', it becomes '-'. Where can that stick go?",
      "Can '6' become an '8' (8 - 4 = 4) OR can '6' become a '0' (0 + 4 = 4)?"
    ],
    solutionDescription: "Two valid solutions: 1) Move the vertical match from '+' to the '6' to make '8 - 4 = 4'. 2) Move the middle match from '6' to the top-right to make '0 + 4 = 4'."
  },
  {
    id: 5,
    stage: 2,
    stageName: "Stage 2 — Think Differently",
    difficulty: "Medium",
    title: "The Knight's Circuit",
    subtitle: "Route power through all nodes with at most 4 turns",
    type: "limited-turns",
    timeLimit: 110,
    requiredMoves: 4,
    objective: "Navigate from Start to Terminal while powering all 3 capacitor nodes in at most 4 turns (5 straight segments).",
    rules: [
      "Start at the green node 'IN' and reach the cyan node 'OUT'.",
      "Pass through all 3 purple capacitor nodes.",
      "Do not cross red firewall barriers.",
      "Change direction at most 4 times (maximum 5 straight line segments)."
    ],
    authorTip: "Moving in long, sweeping corridors covers multiple targets in one go.",
    hints: [
      "Avoid weaving back and forth; turns are your most precious resource.",
      "Align segments so a single straight line hits two capacitors simultaneously.",
      "Shoot all the way to the outer wall before turning to maximize corridor coverage."
    ],
    solutionDescription: "Move straight down to capture the first two aligned nodes, turn right to the far wall, turn up through the third node, turn left, and turn down into OUT."
  },
  {
    id: 6,
    stage: 2,
    stageName: "Stage 2 — Think Differently",
    difficulty: "Hard",
    title: "The Paradox Square",
    subtitle: "Unlock the hidden dimension by shifting tiles",
    type: "spatial-shift",
    timeLimit: 100,
    requiredMoves: 4,
    objective: "Slide the 4 interlocking corner tiles outward to reveal the central power crystal.",
    rules: [
      "Slide each of the 4 corner wedges outwards into their outer expansion tracks.",
      "Each tile must lock into its outer groove.",
      "Once all 4 tiles are shifted, the hidden central square is exposed.",
      "Click the unlocked central core to complete the circuit."
    ],
    authorTip: "Things tightly packed can hide surprising volume when expanded outward.",
    hints: [
      "Click or drag each of the 4 corner blocks outwards away from the center.",
      "Watch the center cavity expand as the perimeter shifts.",
      "Tap the glowing crystal once the aperture opens!"
    ],
    solutionDescription: "Slide all four L-tiles outward along their diagonal guide rails to expose the inner chamber, then collect the crystal."
  },
  {
    id: 7,
    stage: 2,
    stageName: "Stage 2 — Think Differently",
    difficulty: "Hard",
    title: "The Three Switches Paradox",
    subtitle: "A classic lateral thinking trial of heat & light",
    type: "lateral-switches",
    timeLimit: 120,
    requiredMoves: 3,
    objective: "Determine which switch (A, B, or C) controls the bulb inside the sealed room. You may only enter the room ONCE.",
    rules: [
      "Three switches (A, B, C) are outside.",
      "One incandescent bulb is inside behind the closed door.",
      "You can toggle switches freely.",
      "Once you enter the room, the door locks behind you. You must test the bulb and declare the correct switch.",
      "Remember: Incandescent bulbs produce something other than just light!"
    ],
    authorTip: "What changes about a lightbulb over time when electricity flows through it?",
    hints: [
      "Light isn't the only property of an active incandescent bulb.",
      "Bulbs get hot when left turned on for several seconds.",
      "Turn Switch A ON and wait 10 seconds. Then turn Switch A OFF, turn Switch B ON, and enter immediately! If bulb is ON -> B. If OFF but WARM -> A. If OFF and COLD -> C."
    ],
    solutionDescription: "Turn Switch A ON, let the thermal timer run until bulb is HOT, turn Switch A OFF, turn Switch B ON, enter room! Inspect bulb status (Light + Heat) to pinpoint the exact switch."
  },

  // =========================================================================
  // STAGE 3 — BRAIN MASTER
  // =========================================================================
  {
    id: 8,
    stage: 3,
    stageName: "Stage 3 — Brain Master",
    difficulty: "Expert",
    title: "The 16-Dot Matrix",
    subtitle: "Connect a 4x4 grid in six continuous straight lines",
    type: "dot-matrix",
    timeLimit: 140,
    requiredLines: 6,
    objective: "Connect all sixteen dots in a 4x4 grid using exactly six connected straight lines.",
    rules: [
      "Connect all sixteen dots.",
      "Use exactly six continuous straight line segments.",
      "Never lift the pointer between segments.",
      "Lines can and must extend far beyond the 4x4 bounding box."
    ],
    authorTip: "Expand your coordinates into negative space to sweep diagonal rows.",
    hints: [
      "If 9 dots needed extending beyond the box, 16 dots require multiple exterior pivots.",
      "Zigzag diagonally starting outside the bottom-left.",
      "Let segment 1 and segment 3 overshoot the 4x4 grid corners by two full units."
    ],
    solutionDescription: "Traverse diagonally from outside the perimeter, looping through external pivot points to cover 4, 3, 3, 2, 2, 2 dots across 6 long lines."
  },
  {
    id: 9,
    stage: 3,
    stageName: "Stage 3 — Brain Master",
    difficulty: "Expert",
    title: "Photon Prism Matrix",
    subtitle: "Bend the laser beam through optical sensor relays",
    type: "laser-optics",
    timeLimit: 130,
    requiredMoves: 4,
    objective: "Place angled prism mirrors on the grid to reflect the laser beam into all 4 optical sensors without hitting dark absorption blocks.",
    rules: [
      "Click or drag 45° angle mirrors onto highlighted grid relay pedestals.",
      "Click a mirror on the board to rotate its 45-degree reflection angle.",
      "The laser must travel from EMITTER to RECEIVER, striking all 4 targets along its path.",
      "Avoid hitting the dark absorption barriers."
    ],
    authorTip: "Work backwards from the target receivers as well as forward from the emitter.",
    hints: [
      "Each mirror turns the laser beam exactly 90 degrees.",
      "Route the beam in a figure-eight or rectangular loop around the central barrier.",
      "Ensure the beam hits each target sensor perpendicularly or squarely."
    ],
    solutionDescription: "Place mirrors at coordinates (1,1), (1,4), (4,4), and (4,1), angling them to create a continuous perimeter bounce that strikes all four sensors."
  },
  {
    id: 10,
    stage: 3,
    stageName: "Stage 3 — Brain Master",
    difficulty: "Master",
    title: "The Symposium Vault",
    subtitle: "The ultimate meta-puzzle: The answer is outside the box",
    type: "master-vault",
    timeLimit: 150,
    requiredMoves: 3,
    objective: "Align the 3 vault security rings, and then perform the literal 'outside the box' action to unlock the Master Core.",
    rules: [
      "Rotate Ring 1, Ring 2, and Ring 3 until the glyph circuits align.",
      "Notice the master power core socket is located outside the central puzzle frame!",
      "Drag the glowing Power Fuse completely OUTSIDE the puzzle workspace box into the terminal slot.",
      "Break the boundary to claim the Grandmaster title."
    ],
    authorTip: "Read the game's title again. The solution is not trapped inside the canvas.",
    hints: [
      "Align the three concentric rings so the cyan line forms a continuous radial spoke.",
      "Once aligned, the power fuse pops out. Can you drag it past the border?",
      "Drag the fuse out of the center card and drop it directly onto the 'Outside Power Terminal' in the sidebar!"
    ],
    solutionDescription: "Align the 3 rings to activate the fuse, then literally drag the fuse OUT of the puzzle box into the External Power Receiver on the right panel to solve the game!"
  }
];
