/**
 * converter.js
 * Core conversion algorithms that generate step-by-step explanations.
 * Each function returns an array of step objects used by the step viewer.
 */

const Converter = (() => {
  // ===== Lookup Tables =====
  const OCTAL_TO_BIN = {
    '0': '000', '1': '001', '2': '010', '3': '011',
    '4': '100', '5': '101', '6': '110', '7': '111'
  };

  const HEX_TO_BIN = {
    '0': '0000', '1': '0001', '2': '0010', '3': '0011',
    '4': '0100', '5': '0101', '6': '0110', '7': '0111',
    '8': '1000', '9': '1001', 'A': '1010', 'B': '1011',
    'C': '1100', 'D': '1101', 'E': '1110', 'F': '1111'
  };

  const BIN_TO_OCTAL = {};
  for (const [k, v] of Object.entries(OCTAL_TO_BIN)) BIN_TO_OCTAL[v] = k;

  const BIN_TO_HEX = {};
  for (const [k, v] of Object.entries(HEX_TO_BIN)) BIN_TO_HEX[v] = k;

  // ===== Input Validators =====
  function isValidBinary(str) {
    return /^[01]+$/.test(str);
  }

  function isValidOctal(str) {
    return /^[0-7]+$/.test(str);
  }

  function isValidHex(str) {
    return /^[0-9A-Fa-f]+$/.test(str);
  }

  function isValidDecimal(str) {
    return /^\d+$/.test(str) && parseInt(str) >= 0;
  }

  // ===== Validation Map =====
  const validators = {
    'dec-bin': { validate: isValidDecimal, base: 'Desimal', chars: '0-9' },
    'dec-oct': { validate: isValidDecimal, base: 'Desimal', chars: '0-9' },
    'dec-hex': { validate: isValidDecimal, base: 'Desimal', chars: '0-9' },
    'bin-dec': { validate: isValidBinary, base: 'Biner', chars: '0 dan 1' },
    'bin-oct': { validate: isValidBinary, base: 'Biner', chars: '0 dan 1' },
    'bin-hex': { validate: isValidBinary, base: 'Biner', chars: '0 dan 1' },
  };

  // ===== DECIMAL → BINARY =====
  function decimalToBinary(input) {
    const dec = parseInt(input, 10);
    const steps = [];

    if (dec === 0) {
      steps.push({
        type: 'info',
        stepLabel: 'Langkah 1',
        instruction: `Angka <strong>${dec}</strong> dalam desimal langsung menjadi <strong>0</strong> dalam biner.`,
        data: null
      });
      steps.push({
        type: 'result',
        stepLabel: 'Hasil',
        instruction: `Konversi selesai.`,
        result: '0',
        fromBase: '10',
        toBase: '2'
      });
      return { steps, result: '0' };
    }

    // Step 1: Explain the method
    steps.push({
      type: 'info',
      stepLabel: 'Langkah 1 — Metode',
      instruction: `Untuk mengkonversi <strong>${dec}</strong> (desimal) ke biner, kita akan membagi bilangan tersebut dengan <strong>2</strong> secara berulang dan mencatat <strong>sisa</strong> pembagiannya. Sisa-sisa ini, dibaca dari bawah ke atas, akan membentuk bilangan biner.`,
      data: null
    });

    // Step 2-N: Division steps
    const divisions = [];
    let quotient = dec;
    let stepIdx = 2;

    while (quotient > 0) {
      const remainder = quotient % 2;
      const newQuotient = Math.floor(quotient / 2);
      divisions.push({
        dividend: quotient,
        divisor: 2,
        quotient: newQuotient,
        remainder: remainder,
        remainderDisplay: remainder.toString()
      });
      
      steps.push({
        type: 'division',
        stepLabel: `Langkah ${stepIdx} — Pembagian ke-${divisions.length}`,
        instruction: `Bagi <strong>${quotient}</strong> dengan <strong>2</strong>. Hasilnya <strong>${newQuotient}</strong>, sisa <strong>${remainder}</strong>.`,
        data: {
          divisions: [...divisions],
          highlightIndex: divisions.length - 1,
          tryAnswer: remainder
        }
      });
      
      quotient = newQuotient;
      stepIdx++;
    }

    // Final step: read remainders bottom to top
    const binaryResult = divisions.map(d => d.remainder).reverse().join('');

    steps.push({
      type: 'division-result',
      stepLabel: `Langkah ${stepIdx} — Membaca Hasil`,
      instruction: `Baca semua sisa pembagian dari <strong>bawah ke atas</strong> untuk mendapatkan bilangan biner.`,
      data: {
        divisions: divisions,
        result: binaryResult
      }
    });

    steps.push({
      type: 'result',
      stepLabel: 'Hasil Akhir',
      instruction: `Konversi <strong>${dec}</strong> (desimal) ke biner berhasil.`,
      result: binaryResult,
      fromBase: '10',
      toBase: '2'
    });

    return { steps, result: binaryResult };
  }

  // ===== DECIMAL → OCTAL =====
  function decimalToOctal(input) {
    const dec = parseInt(input, 10);
    const steps = [];

    if (dec === 0) {
      steps.push({
        type: 'info',
        stepLabel: 'Langkah 1',
        instruction: `Angka <strong>${dec}</strong> dalam desimal langsung bernilai <strong>0</strong> dalam oktal.`,
        data: null
      });
      steps.push({
        type: 'result',
        stepLabel: 'Hasil',
        instruction: `Konversi selesai.`,
        result: '0',
        fromBase: '10',
        toBase: '8'
      });
      return { steps, result: '0' };
    }

    steps.push({
      type: 'info',
      stepLabel: 'Langkah 1 — Metode',
      instruction: `Untuk mengkonversi <strong>${dec}</strong> (desimal) ke oktal, kita membagi bilangan tersebut dengan <strong>8</strong> secara berulang dan mencatat <strong>sisa</strong> pembagiannya. Sisa-sisa ini dibaca dari <strong>bawah ke atas</strong> untuk membentuk bilangan oktal.`,
      data: null
    });

    const divisions = [];
    let quotient = dec;
    let stepIdx = 2;

    while (quotient > 0) {
      const remainder = quotient % 8;
      const newQuotient = Math.floor(quotient / 8);
      divisions.push({
        dividend: quotient,
        divisor: 8,
        quotient: newQuotient,
        remainder: remainder,
        remainderDisplay: remainder.toString()
      });

      steps.push({
        type: 'division',
        stepLabel: `Langkah ${stepIdx} — Pembagian ke-${divisions.length}`,
        instruction: `Bagi <strong>${quotient}</strong> dengan <strong>8</strong>. Hasilnya <strong>${newQuotient}</strong>, sisa <strong>${remainder}</strong>.`,
        data: {
          divisions: [...divisions],
          highlightIndex: divisions.length - 1,
          tryAnswer: remainder
        }
      });

      quotient = newQuotient;
      stepIdx++;
    }

    const octalResult = divisions.map(d => d.remainder).reverse().join('');

    steps.push({
      type: 'division-result',
      stepLabel: `Langkah ${stepIdx} — Membaca Hasil`,
      instruction: `Baca semua sisa pembagian dari <strong>bawah ke atas</strong> untuk mendapatkan bilangan oktal.`,
      data: {
        divisions: divisions,
        result: octalResult
      }
    });

    steps.push({
      type: 'result',
      stepLabel: 'Hasil Akhir',
      instruction: `Konversi <strong>${dec}</strong> (desimal) ke oktal berhasil.`,
      result: octalResult,
      fromBase: '10',
      toBase: '8'
    });

    return { steps, result: octalResult };
  }

  // ===== DECIMAL → HEX =====
  const DEC_TO_HEX_MAP = {
    10: 'A', 11: 'B', 12: 'C', 13: 'D', 14: 'E', 15: 'F'
  };

  function decimalToHex(input) {
    const dec = parseInt(input, 10);
    const steps = [];

    if (dec === 0) {
      steps.push({
        type: 'info',
        stepLabel: 'Langkah 1',
        instruction: `Angka <strong>${dec}</strong> dalam desimal langsung bernilai <strong>0</strong> dalam heksadesimal.`,
        data: null
      });
      steps.push({
        type: 'result',
        stepLabel: 'Hasil',
        instruction: `Konversi selesai.`,
        result: '0',
        fromBase: '10',
        toBase: '16'
      });
      return { steps, result: '0' };
    }

    steps.push({
      type: 'info',
      stepLabel: 'Langkah 1 — Metode',
      instruction: `Untuk mengkonversi <strong>${dec}</strong> (desimal) ke heksadesimal, kita membagi bilangan tersebut dengan <strong>16</strong> secara berulang dan mencatat <strong>sisa</strong> pembagiannya. Jika sisa antara 10&ndash;15, kita ubah ke simbol huruf: <strong>10=A, 11=B, 12=C, 13=D, 14=E, 15=F</strong>. Sisa dibaca dari <strong>bawah ke atas</strong>.`,
      data: null
    });

    const divisions = [];
    let quotient = dec;
    let stepIdx = 2;

    while (quotient > 0) {
      const remainder = quotient % 16;
      const newQuotient = Math.floor(quotient / 16);
      const hexChar = remainder >= 10 ? DEC_TO_HEX_MAP[remainder] : remainder.toString();
      const displayRemainder = remainder >= 10 ? `${remainder} (${hexChar})` : remainder.toString();

      divisions.push({
        dividend: quotient,
        divisor: 16,
        quotient: newQuotient,
        remainder: remainder,
        hexDigit: hexChar,
        remainderDisplay: displayRemainder
      });

      const explanation = remainder >= 10
        ? `Bagi <strong>${quotient}</strong> dengan <strong>16</strong>. Hasilnya <strong>${newQuotient}</strong>, sisa <strong>${remainder}</strong> &rarr; disimbolkan menjadi <strong>${hexChar}</strong>.`
        : `Bagi <strong>${quotient}</strong> dengan <strong>16</strong>. Hasilnya <strong>${newQuotient}</strong>, sisa <strong>${remainder}</strong>.`;

      steps.push({
        type: 'division',
        stepLabel: `Langkah ${stepIdx} — Pembagian ke-${divisions.length}`,
        instruction: explanation,
        data: {
          divisions: [...divisions],
          highlightIndex: divisions.length - 1,
          tryAnswer: remainder >= 10 ? `${hexChar}|${remainder}` : remainder
        }
      });

      quotient = newQuotient;
      stepIdx++;
    }

    const hexResult = divisions.map(d => d.hexDigit).reverse().join('');

    steps.push({
      type: 'division-result',
      stepLabel: `Langkah ${stepIdx} — Membaca Hasil`,
      instruction: `Baca semua sisa pembagian dari <strong>bawah ke atas</strong> menggunakan simbol heksadesimal.`,
      data: {
        divisions: divisions,
        result: hexResult
      }
    });

    steps.push({
      type: 'result',
      stepLabel: 'Hasil Akhir',
      instruction: `Konversi <strong>${dec}</strong> (desimal) ke heksadesimal berhasil.`,
      result: hexResult,
      fromBase: '10',
      toBase: '16'
    });

    return { steps, result: hexResult };
  }

  // ===== BINARY → DECIMAL =====
  function binaryToDecimal(input) {
    const bits = input.split('');
    const steps = [];
    const len = bits.length;

    steps.push({
      type: 'info',
      stepLabel: 'Langkah 1 — Metode',
      instruction: `Untuk mengkonversi <strong>${input}</strong> (biner) ke desimal, kita mengalikan setiap bit dengan <strong>2 pangkat posisinya</strong> (dihitung dari kanan, mulai dari 0), lalu menjumlahkan semuanya.`,
      data: null
    });

    // Step 2: Show positional values
    const positions = bits.map((bit, i) => ({
      bit: bit,
      position: len - 1 - i,
      powerValue: Math.pow(2, len - 1 - i),
      value: parseInt(bit) * Math.pow(2, len - 1 - i)
    }));

    steps.push({
      type: 'positional',
      stepLabel: 'Langkah 2 — Identifikasi Posisi',
      instruction: `Tentukan posisi (pangkat 2) untuk setiap bit, dari kanan ke kiri dimulai dari posisi 0.`,
      data: {
        positions: positions,
        highlightIndex: -1
      }
    });

    // Step 3-N: Calculate each bit
    positions.forEach((pos, i) => {
      steps.push({
        type: 'positional',
        stepLabel: `Langkah ${3 + i} — Hitung Bit ke-${i + 1}`,
        instruction: `Bit <strong>${pos.bit}</strong> pada posisi <strong>${pos.position}</strong>: ${pos.bit} x 2<sup>${pos.position}</sup> = ${pos.bit} x ${pos.powerValue} = <strong>${pos.value}</strong>.`,
        data: {
          positions: positions,
          highlightIndex: i,
          tryAnswer: pos.value
        }
      });
    });

    // Sum step
    const terms = positions.map(p => p.value);
    const result = terms.reduce((a, b) => a + b, 0);

    steps.push({
      type: 'calculation',
      stepLabel: `Langkah ${3 + len} — Jumlahkan`,
      instruction: `Jumlahkan semua nilai posisi:`,
      data: {
        positions: positions,
        terms: terms,
        result: result,
        tryAnswer: result
      }
    });

    steps.push({
      type: 'result',
      stepLabel: 'Hasil Akhir',
      instruction: `Konversi <strong>${input}</strong> (biner) ke desimal berhasil.`,
      result: result.toString(),
      fromBase: '2',
      toBase: '10'
    });

    return { steps, result: result.toString() };
  }

  // ===== BINARY → OCTAL =====
  function binaryToOctal(input) {
    const steps = [];

    steps.push({
      type: 'info',
      stepLabel: 'Langkah 1 — Metode',
      instruction: `Untuk mengkonversi <strong>${input}</strong> (biner) ke oktal, kita kelompokkan bit-bit menjadi kelompok <strong>3 bit dari kanan</strong>, lalu konversi setiap kelompok ke digit oktal. Ini karena 2<sup>3</sup> = 8.`,
      data: null
    });

    // Pad to multiple of 3
    let padded = input;
    while (padded.length % 3 !== 0) {
      padded = '0' + padded;
    }

    // Split into groups of 3
    const groupStrs = [];
    for (let i = 0; i < padded.length; i += 3) {
      groupStrs.push(padded.substring(i, i + 3));
    }

    steps.push({
      type: 'info',
      stepLabel: 'Langkah 2 — Kelompokkan 3 Bit',
      instruction: `Kelompokkan dari kanan: <strong>${groupStrs.join(' ')}</strong>. ${padded !== input ? `(Ditambahkan nol di depan agar kelipatan 3 bit.)` : ''}`,
      data: null
    });

    // Convert each group
    const groups = [];
    groupStrs.forEach((grp, i) => {
      const octalDigit = BIN_TO_OCTAL[grp];
      groups.push({ source: grp, result: octalDigit });

      steps.push({
        type: 'bit-group-reverse',
        stepLabel: `Langkah ${3 + i} — Konversi Kelompok "${grp}"`,
        instruction: `Kelompok biner <strong>${grp}</strong> = <strong>${octalDigit}</strong> dalam oktal.`,
        data: {
          groups: [...groups],
          highlightIndex: i,
          bitSize: 3,
          tryAnswer: octalDigit
        }
      });
    });

    const result = groups.map(g => g.result).join('').replace(/^0+/, '') || '0';

    steps.push({
      type: 'combine',
      stepLabel: `Langkah ${3 + groupStrs.length} — Gabungkan`,
      instruction: `Gabungkan semua digit oktal: <strong>${groups.map(g => g.result).join('')}</strong>.`,
      data: {
        groups: groups,
        combined: groups.map(g => g.result).join(''),
        result: result
      }
    });

    steps.push({
      type: 'result',
      stepLabel: 'Hasil Akhir',
      instruction: `Konversi <strong>${input}</strong> (biner) ke oktal berhasil.`,
      result: result,
      fromBase: '2',
      toBase: '8'
    });

    return { steps, result };
  }

  // ===== BINARY → HEX =====
  function binaryToHex(input) {
    const steps = [];

    steps.push({
      type: 'info',
      stepLabel: 'Langkah 1 — Metode',
      instruction: `Untuk mengkonversi <strong>${input}</strong> (biner) ke heksadesimal, kita kelompokkan bit-bit menjadi kelompok <strong>4 bit dari kanan</strong>, lalu konversi setiap kelompok ke digit heksadesimal. Ini karena 2<sup>4</sup> = 16.`,
      data: null
    });

    // Pad to multiple of 4
    let padded = input;
    while (padded.length % 4 !== 0) {
      padded = '0' + padded;
    }

    const groupStrs = [];
    for (let i = 0; i < padded.length; i += 4) {
      groupStrs.push(padded.substring(i, i + 4));
    }

    steps.push({
      type: 'info',
      stepLabel: 'Langkah 2 — Kelompokkan 4 Bit',
      instruction: `Kelompokkan dari kanan: <strong>${groupStrs.join(' ')}</strong>. ${padded !== input ? `(Ditambahkan nol di depan agar kelipatan 4 bit.)` : ''}`,
      data: null
    });

    const groups = [];
    groupStrs.forEach((grp, i) => {
      const hexDigit = BIN_TO_HEX[grp];
      groups.push({ source: grp, result: hexDigit });

      steps.push({
        type: 'bit-group-reverse',
        stepLabel: `Langkah ${3 + i} — Konversi Kelompok "${grp}"`,
        instruction: `Kelompok biner <strong>${grp}</strong> = <strong>${hexDigit}</strong> dalam heksadesimal.`,
        data: {
          groups: [...groups],
          highlightIndex: i,
          bitSize: 4,
          tryAnswer: hexDigit
        }
      });
    });

    const result = groups.map(g => g.result).join('').replace(/^0+/, '') || '0';

    steps.push({
      type: 'combine',
      stepLabel: `Langkah ${3 + groupStrs.length} — Gabungkan`,
      instruction: `Gabungkan semua digit heksadesimal: <strong>${groups.map(g => g.result).join('')}</strong>.`,
      data: {
        groups: groups,
        combined: groups.map(g => g.result).join(''),
        result: result
      }
    });

    steps.push({
      type: 'result',
      stepLabel: 'Hasil Akhir',
      instruction: `Konversi <strong>${input}</strong> (biner) ke heksadesimal berhasil.`,
      result: result,
      fromBase: '2',
      toBase: '16'
    });

    return { steps, result };
  }

  // ===== Public API =====
  const converters = {
    'dec-bin': decimalToBinary,
    'dec-oct': decimalToOctal,
    'dec-hex': decimalToHex,
    'bin-dec': binaryToDecimal,
    'bin-oct': binaryToOctal,
    'bin-hex': binaryToHex,
  };

  const labels = {
    'dec-bin': { from: 'Desimal', to: 'Biner', fromBase: '10', toBase: '2' },
    'dec-oct': { from: 'Desimal', to: 'Oktal', fromBase: '10', toBase: '8' },
    'dec-hex': { from: 'Desimal', to: 'Heksadesimal', fromBase: '10', toBase: '16' },
    'bin-dec': { from: 'Biner', to: 'Desimal', fromBase: '2', toBase: '10' },
    'bin-oct': { from: 'Biner', to: 'Oktal', fromBase: '2', toBase: '8' },
    'bin-hex': { from: 'Biner', to: 'Heksadesimal', fromBase: '2', toBase: '16' },
  };

  function convert(type, input) {
    const fn = converters[type];
    if (!fn) throw new Error(`Unknown conversion type: ${type}`);
    return fn(input.trim());
  }

  function validate(type, input) {
    const v = validators[type];
    if (!v) return { valid: false, message: 'Tipe konversi tidak dikenal.' };
    const trimmed = input.trim();
    if (trimmed === '') return { valid: false, message: `Masukkan bilangan ${v.base}.` };
    if (!v.validate(trimmed)) {
      return { valid: false, message: `Input tidak valid. Bilangan ${v.base} hanya menggunakan karakter: ${v.chars}.` };
    }
    if (trimmed.length > 32) {
      return { valid: false, message: 'Input terlalu panjang (maksimal 32 karakter).' };
    }
    return { valid: true, message: '' };
  }

  function getLabel(type) {
    return labels[type];
  }

  function getPlaceholder(type) {
    const placeholders = {
      'dec-bin': 'Masukkan bilangan desimal, contoh: 25',
      'dec-oct': 'Masukkan bilangan desimal, contoh: 125',
      'dec-hex': 'Masukkan bilangan desimal, contoh: 254',
      'bin-dec': 'Masukkan bilangan biner, contoh: 11001',
      'bin-oct': 'Masukkan bilangan biner, contoh: 11001',
      'bin-hex': 'Masukkan bilangan biner, contoh: 101111',
    };
    return placeholders[type] || 'Masukkan bilangan';
  }

  return { convert, validate, getLabel, getPlaceholder };
})();
