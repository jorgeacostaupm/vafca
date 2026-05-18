const clampProbability = (value: number) => Math.min(1, Math.max(0, value));

const erf = (x: number) => {
  const sign = x < 0 ? -1 : 1;
  const ax = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * ax);
  const y =
    1 -
    (((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t +
      0.254829592) *
      t *
      Math.exp(-ax * ax));
  return sign * y;
};

export const normalCdf = (x: number) => {
  if (x === Number.POSITIVE_INFINITY) return 1;
  if (x === Number.NEGATIVE_INFINITY) return 0;
  if (!Number.isFinite(x)) return Number.NaN;
  return clampProbability(0.5 * (1 + erf(x / Math.SQRT2)));
};

const logGamma = (z: number): number => {
  const coefficients = [
    676.5203681218851,
    -1259.1392167224028,
    771.3234287776531,
    -176.6150291621406,
    12.507343278686905,
    -0.13857109526572012,
    9.984369578019572e-6,
    1.5056327351493116e-7,
  ];

  if (z < 0.5) {
    return Math.log(Math.PI) - Math.log(Math.sin(Math.PI * z)) - logGamma(1 - z);
  }

  let x = 0.9999999999998099;
  const shifted = z - 1;
  for (let i = 0; i < coefficients.length; i += 1) {
    x += coefficients[i] / (shifted + i + 1);
  }
  const t = shifted + coefficients.length - 0.5;
  return 0.5 * Math.log(2 * Math.PI) + (shifted + 0.5) * Math.log(t) - t + Math.log(x);
};

const betaContinuedFraction = (a: number, b: number, x: number) => {
  const maxIterations = 200;
  const fpmin = 1e-30;
  const eps = 3e-14;
  const qab = a + b;
  const qap = a + 1;
  const qam = a - 1;
  let c = 1;
  let d = 1 - (qab * x) / qap;
  if (Math.abs(d) < fpmin) d = fpmin;
  d = 1 / d;
  let h = d;

  for (let m = 1; m <= maxIterations; m += 1) {
    const m2 = 2 * m;
    let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < fpmin) d = fpmin;
    c = 1 + aa / c;
    if (Math.abs(c) < fpmin) c = fpmin;
    d = 1 / d;
    h *= d * c;

    aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < fpmin) d = fpmin;
    c = 1 + aa / c;
    if (Math.abs(c) < fpmin) c = fpmin;
    d = 1 / d;
    const del = d * c;
    h *= del;
    if (Math.abs(del - 1) <= eps) break;
  }

  return h;
};

const regularizedIncompleteBeta = (x: number, a: number, b: number) => {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const bt = Math.exp(
    logGamma(a + b) - logGamma(a) - logGamma(b) +
      a * Math.log(x) +
      b * Math.log(1 - x),
  );
  if (x < (a + 1) / (a + b + 2)) {
    return (bt * betaContinuedFraction(a, b, x)) / a;
  }
  return 1 - (bt * betaContinuedFraction(b, a, 1 - x)) / b;
};

export const studentTCdf = (t: number, df: number) => {
  if (!Number.isFinite(t) || !Number.isFinite(df) || df <= 0) return Number.NaN;
  const x = df / (df + t * t);
  const ib = regularizedIncompleteBeta(x, df / 2, 0.5);
  const cdf = t >= 0 ? 1 - 0.5 * ib : 0.5 * ib;
  return clampProbability(cdf);
};

export const twoSidedNormalPValue = (z: number) =>
  clampProbability(2 * (1 - normalCdf(Math.abs(z))));

export const twoSidedStudentTPValue = (t: number, df: number) =>
  clampProbability(2 * (1 - studentTCdf(Math.abs(t), df)));
