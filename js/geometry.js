/**
 * Vector Mathematics & Geometric Validation Utilities
 */

export const Geometry = {
  // Distance squared between two points
  distSq(p1, p2) {
    const dx = p1.x - p2.x;
    const dy = p1.y - p2.y;
    return dx * dx + dy * dy;
  },

  // Euclidean distance
  dist(p1, p2) {
    return Math.sqrt(this.distSq(p1, p2));
  },

  // Perpendicular distance from point P to line segment AB
  distToSegment(p, a, b) {
    const l2 = this.distSq(a, b);
    if (l2 === 0) return this.dist(p, a);

    // Consider the line extending the segment, parameterized as a + t (b - a).
    // Projection of point p onto the line.
    let t = ((p.x - a.x) * (b.x - a.x) + (p.y - a.y) * (b.y - a.y)) / l2;
    t = Math.max(0, Math.min(1, t));

    const proj = {
      x: a.x + t * (b.x - a.x),
      y: a.y + t * (b.y - a.y)
    };
    return this.dist(p, proj);
  },

  // Check if dot with radius r is covered/hit by segment AB
  isDotCoveredBySegment(dot, a, b, tolerance = 18) {
    const d = this.distToSegment(dot, a, b);
    return d <= (dot.radius || 10) + tolerance;
  },

  // Check if any segment in a polyline covers the dot
  isDotCoveredByPolyline(dot, points, tolerance = 18) {
    if (points.length < 2) return false;
    for (let i = 0; i < points.length - 1; i++) {
      if (this.isDotCoveredBySegment(dot, points[i], points[i + 1], tolerance)) {
        return true;
      }
    }
    return false;
  },

  // Check collinearity of three points within an angular tolerance (in degrees)
  isCollinear(a, b, c, angleToleranceDeg = 12) {
    const angle1 = Math.atan2(b.y - a.y, b.x - a.x);
    const angle2 = Math.atan2(c.y - b.y, c.x - b.x);
    let diff = Math.abs(angle1 - angle2) * (180 / Math.PI);
    while (diff > 180) diff = Math.abs(360 - diff);
    return diff <= angleToleranceDeg || Math.abs(180 - diff) <= angleToleranceDeg;
  },

  // Simplify a freehand stroke of many points into key corner waypoints using RDP algorithm
  simplifyPath(points, epsilon = 15) {
    if (points.length <= 2) return points;

    let dmax = 0;
    let index = 0;
    const end = points.length - 1;

    for (let i = 1; i < end; i++) {
      const d = this.distToSegment(points[i], points[0], points[end]);
      if (d > dmax) {
        index = i;
        dmax = d;
      }
    }

    if (dmax > epsilon) {
      const rec1 = this.simplifyPath(points.slice(0, index + 1), epsilon);
      const rec2 = this.simplifyPath(points.slice(index), epsilon);
      return rec1.slice(0, rec1.length - 1).concat(rec2);
    } else {
      return [points[0], points[end]];
    }
  },

  // Count straight line segments from simplified points
  countSegments(points, angleToleranceDeg = 15) {
    if (points.length <= 1) return 0;
    if (points.length === 2) return 1;

    let segments = 1;
    let lastAngle = Math.atan2(points[1].y - points[0].y, points[1].x - points[0].x);

    for (let i = 2; i < points.length; i++) {
      const currentAngle = Math.atan2(points[i].y - points[i - 1].y, points[i].x - points[i - 1].x);
      let diff = Math.abs(currentAngle - lastAngle) * (180 / Math.PI);
      while (diff > 180) diff = Math.abs(360 - diff);

      if (diff > angleToleranceDeg && Math.abs(180 - diff) > angleToleranceDeg) {
        segments++;
        lastAngle = currentAngle;
      }
    }
    return segments;
  }
};
