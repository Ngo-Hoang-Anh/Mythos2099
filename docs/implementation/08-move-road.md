# 08 — Drive paths (own side)

Board tokens park on the **outer edge** of each side’s two cells (Support toward HQ, Front toward the empty frontier). The frontier between P1 Front and P2 Front is a blank gap — no painted road.

Moves stay in own territory. Orthogonal or diagonal neighbors drive park-to-park with only a light bow. Longer lane changes follow the imaginary aisle between Support and Front so the unit does not drive through an allied park. Those waypoints become a Catmull-Rom curve (`curveDrivePath`) pushed off allied circles.

On arrival the hull keeps the last heading; guns traverse toward the enemy.
