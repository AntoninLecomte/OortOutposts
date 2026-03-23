# Oort outposts

## Main concepts
Oort outposts is a web-based game proposing up to 1 week games opposing up to 8 players in the colonization and domination of asteroids cluster.

Players will explore, colonize and develop small asteroids, exploiting ressources to obliterate their neighbours and ceize total control of the cluster.

### Technology development
Througout the game, technologies allowing construction of building and units will be unlocked, in the form of a tech tree.

### Ressources mining, processing and distribution
Asteroids will be proceduraly furnished with **raw minerals** and **water**. The ressources are not shared within astroids, cargo ships can be used to transfer.

### Energy
Players will be required to produce **energy**, directly linked to time efficiency. Energy budget can be distributed among main functions, to prioritize Research, Construction, Ressources extraction or Military production.

### Military assets production
Military assets include: 
- Spacecrafts with specific assets:
    - Initiative
    - Fire power
    - Bonus fire power against ennemy types
    - Speed
    - Range
    - Shield
    - Structure points
- Passive and active defense infrastructure (same assets).
- Interasteroid weapons

### Space observation and light speed
Basic infrastructures offer a limited view around the astroids. For defensive or offensive purposes, new buildings have to be constructed to increase the detection range.

Detection range allows spying of the enemy astroids and detection of ennemy fleets.

Observing ennemy positions is always in reference with an observer source, the closest one, with an indication of the time gap due to light speed information propagation.

### Fleet management
Fleets are sent between asteroids. Once in a trip, a fleet can turn around, but cannot target another asteroid. Allied fleets crossing on the same trip will not merge.

Allied fleets meeting on an asteroid will not merge automatically. A ship created on an asteroid will automatically join the largest available fleet.

Fleets travel at the lowest spacecraft speed.

Ennemy fleets crossing on the same trip will trigger a combat. A spacecraft can only fire once when leaving a allied asteroid. Spacecrafts cannot be repaired.

Defense infrastructure and docked military vessels are merged into a defending fleet when defending an asteroid.

### Combat
Each combat (fleet vs fleet, fleet vs asteroid) is resolved on a turn by turn attack.

Each fleet or asteroid is configured with a ordering fire. At the begining of the fight, a sequence is defined, intertwining the configuration by iniative. If the initiatives match at start, random.

The sequence is played, each ship firing with the fleet instructions (Highest structure points, Lowest structure points, Highest fire power) (Research, Production, Defense, Administrative). The first target in the list matching fire instructions is targeted. If destroyed, the next target is hit until damage done is matching the attacker fire power.

The sequence is played once. Survivors are turning back to their origin.

### Asteroid capture and win conditions
An asteroid is captured after a combat if all defensive buildings are destroyed and no ennemy fleet is remaining.

A center of operations is built on each starting asteroid. Destruction or capture of the center of operations eliminates player immediatly. The last player alive wins.

### Fleet detection
Spotting an ennemy fleet is also submitted to light speed information propagation.

The map display is always showed relative to a timeline, allowing players to see the past state of the cluster.

Detection of a fleet is always relative to the last event of the fleet (configuration update, destruction, new destination). Once a fleet is spotted, its absolute position is displayed (by speed calculation of the observer), not the observed position.

### Players interaction and chat
Global chat with closed channels to allow alliances and betrayals.


## Views
### Map view
- Selector to see the past cluster state
- Display the distances between the asteroids
- Display the detection range
- Display fleets
- Display asteroids available and current ressources
- Display ally asteroids queues
- Display research queue

### Fleet management view
- Firing order
- Fire instructions
- Move instructions

### Asteroid view
- Built infrastructures
- Log
- Infrastructures building queue
- Spacecrafts building queue
- Energy budget
- Switch to neihbourg asteroids

### Combat view
- Replay of combat
- Spacecrafts list in firing order

### Research view
- Display the tech tree
- Select up to three next researchs