/*
 * 着せ替え（ふく）の絵（要件定義書 5.6.1）。
 * ニャーちゃんの基準画（nya_base.png、1254px）と同じ座標で描いてある。G.Accessory が 体の上に かさねる。
 * 線は ニャーちゃんと同じ 黒くて太い線、ぬりは パステルの べたぬり。
 * opts.noL = 左うで（画面の左がわ）の そでを 描かない（手を あげている絵のとき）
 */
window.G = window.G || {};

G.ClothesArt = (function () {
  const INK = '#1d1a1c', W = 11;
  // 線の 属性。w = 太さ（同じ 属性を 2つ 書くと SVG の 画像が こわれるので、太さは ここで かえる）
  const line = (w = W) => `stroke="${INK}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;

  // 体の目じるし（基準画のピクセル）
  // くび y600、からだの よこ x426〜812（〜y800）、わきの下 (462,906) (776,906)、こし y1040、また y1100、あし 〜y1200
  const NECK_L = [430, 600], NECK_R = [802, 600];

  /* そで（左）。right=true で 左右を はんてん */
  function sleeve(fill, long, right) {
    const pts = long
      ? [[428, 800], [400, 816], [366, 840], [340, 866], [330, 902], [334, 930], [396, 952], [444, 930], [464, 906]]
      : [[428, 800], [400, 816], [368, 840], [348, 862], [434, 932], [464, 906]];
    const p = pts.map(([x, y]) => right ? [1230 - x, y] : [x, y]);
    return `<path d="M${p.map(q => q.join(' ')).join(' L')}Z" fill="${fill}" ${line()}/>`;
  }
  /* からだ（どう）の 形。hem = すその 高さ、flare = すその ひろがり */
  function torso(fill, hem, flare = 0, neck = 'round') {
    const nl = neck === 'v'
      ? `M${NECK_L} L548 600 L615 700 L682 600 L${NECK_R}`
      : `M${NECK_L} L540 600 Q615 664 690 600 L${NECK_R}`;
    return `<path d="${nl} L812 800 L778 906 L${792 + flare} ${hem} Q615 ${hem + 18} ${438 - flare} ${hem} L462 906 L424 800 Z" fill="${fill}" ${line()}/>`;
  }
  const sleeves = (fill, opts, long) => (opts.noL ? '' : sleeve(fill, long, false)) + sleeve(fill, long, true);
  const button = (x, y, c = '#fff8e8') => `<circle cx="${x}" cy="${y}" r="13" fill="${c}" ${line(7)}/>`;
  const star = (x, y, r, c) => {
    let d = '';
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r;
      d += (i ? 'L' : 'M') + (x + Math.cos(a) * rr).toFixed(1) + ' ' + (y + Math.sin(a) * rr).toFixed(1);
    }
    return `<path d="${d}Z" fill="${c}"/>`;
  };
  /* ズボン（左右の あし）。to = すその 高さ */
  function pants(fill, to) {
    return `<path d="M450 960 L788 960 L792 ${to} L676 ${to} L668 1102 Q615 1108 566 1102 L560 ${to} L448 ${to} Z" fill="${fill}" ${line()}/>`;
  }
  /* スカート。from = こしの 高さ、to = すそ、w = すその はば（かた がわ） */
  function skirt(fill, from, to, w, wave) {
    const l = 615 - w, r = 615 + w;
    let hem = '';
    if (wave) {
      const n = 9;
      for (let i = n; i >= 0; i--) {
        const x = l + (r - l) * i / n, xm = l + (r - l) * (i + 0.5) / n;
        hem += i === n ? `L${r} ${to}` : ` Q${xm} ${to + 26} ${x} ${to}`;
      }
    } else hem = `L${r} ${to} Q615 ${to + 30} ${l} ${to}`;
    return `<path d="M456 ${from} L774 ${from} ${hem} Z" fill="${fill}" ${line()}/>`;
  }

  const ART = {
    tshirt: (c, o) => `${torso(c, 1040)}${sleeves(c, o)}
      <path d="M560 760 q55 30 110 0" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="12" stroke-linecap="round"/>
      ${star(615, 820, 34, '#fff8e8')}`,

    onepiece: (c, o) => `${skirt(c, 980, 1160, 230)}${torso(c, 1000)}${sleeves(c, o)}
      <path d="M470 990 Q615 1010 760 990" fill="none" ${line(9)}/>
      ${[[540, 1060], [690, 1060], [615, 1110], [470, 1120], [760, 1120]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="12" fill="#fff" fill-opacity=".8"/>`).join('')}
      ${button(615, 760)}${button(615, 860)}`,

    overall: (c, o) => `${pants('#7fa6d6', 1150)}
      <path d="M486 760 L744 760 L760 980 L470 980 Z" fill="#7fa6d6" ${line()}/>
      <path d="M486 770 L452 640 M744 770 L778 640" ${line(26)} fill="none"/>
      <path d="M486 770 L452 640 M744 770 L778 640" stroke="#7fa6d6" stroke-width="12" stroke-linecap="round" fill="none"/>
      ${button(498, 784, '#f6d860')}${button(732, 784, '#f6d860')}
      <rect x="560" y="830" width="110" height="80" rx="10" fill="#9bbbe3" ${line(8)}/>
      <path d="M615 1000 L615 1080" ${line(7)} fill="none"/>`,

    pajama: (c, o) => `${pants('#bcd9f5', 1180)}${torso('#bcd9f5', 1030)}${sleeves('#bcd9f5', o, true)}
      ${[[520, 720], [700, 700], [580, 880], [740, 860], [500, 1000], [690, 1010], [520, 1130], [720, 1140], [616, 960]].map(([x, y], i) => i % 3 === 2
        ? `<path d="M${x} ${y - 20} a22 22 0 1 0 22 30 a17 17 0 1 1 -22 -30z" fill="#f6d860"/>`
        : star(x, y, 18, '#f6d860')).join('')}
      ${button(615, 700, '#fff')}${button(615, 790, '#fff')}${button(615, 880, '#fff')}`,

    raincoat: (c, o) => `${torso('#f7d64e', 1120, 30, 'v')}${sleeves('#f7d64e', o, true)}
      <path d="M548 600 L590 680 L520 690 Z M682 600 L640 680 L710 690 Z" fill="#f0c22c" ${line(8)}/>
      <path d="M615 700 L615 1130" ${line(8)} fill="none"/>
      ${button(650, 760, '#fff')}${button(650, 860, '#fff')}${button(650, 960, '#fff')}
      <path d="M690 990 L770 990 L770 1060 L690 1060 Z" fill="#f0c22c" ${line(8)}/>`,

    // ジャンパー（前を ファスナーで しめる）
    // ジャンパー（前を ファスナーで しめる）
    jumper: (c, o) => `<path d="M430 600 L802 600 Q818 700 812 800 L784 906 Q842 966 792 1028 Q615 1044 438 1028 Q388 966 446 906 L418 800 Q412 700 430 600 Z" fill="${c}" ${line()}/>
      <path d="M470 700 Q472 652 504 640 M440 1004 Q432 982 444 960" fill="none" stroke="#fff" stroke-opacity=".6" stroke-width="12" stroke-linecap="round"/>
      <path d="M494 922 L516 914 L548 990 L526 998 Z M736 922 L714 914 L682 990 L704 998 Z" fill="#1d1a1c" fill-opacity=".14" ${line(7)}/>
      <path d="M446 1012 Q615 1030 784 1012 L788 1062 Q615 1082 442 1062 Z" fill="${c}" ${line(9)}/><path d="M446 1012 Q615 1030 784 1012 L788 1062 Q615 1082 442 1062 Z" fill="#1d1a1c" fill-opacity=".13"/>
      <path d="M474 1024 L474 1056 M500 1026 L500 1059 M526 1028 L526 1060 M552 1029 L552 1062 M578 1030 L578 1063 M656 1029 L656 1062 M682 1029 L682 1062 M708 1027 L708 1060 M734 1026 L734 1058 M760 1023 L760 1056" ${line(5)} stroke-opacity=".45" fill="none"/>
      ${o.noL ? '' : '<path d="M424 790 Q374 798 363 853 Q378 902 411 941 Q458 962 472 902 Z" fill="' + c + '" ' + line() + '/>' + '<path d="M363 853 L337 868 Q344 922 385 956 L411 941 Q378 902 363 853 Z" fill="' + c + '" ' + line(9) + '/>' + '<path d="M363 853 L337 868 Q344 922 385 956 L411 941 Q378 902 363 853 Z" fill="#1d1a1c" fill-opacity=".13"/>' + '<path d="M365 877 L350 886 M374 895 L358 904 M383 913 L368 922 M395 930 L379 939" ' + line(5) + ' stroke-opacity=".45" fill="none"/>' + '<path d="M392 822 Q404 808 420 806" fill="none" stroke="#fff" stroke-opacity=".6" stroke-width="10" stroke-linecap="round"/>'}
      <path d="M806 790 Q856 798 867 853 Q852 902 819 941 Q772 962 758 902 Z" fill="${c}" ${line()}/>
      <path d="M867 853 L893 868 Q886 922 845 956 L819 941 Q852 902 867 853 Z" fill="${c}" ${line(9)}/><path d="M867 853 L893 868 Q886 922 845 956 L819 941 Q852 902 867 853 Z" fill="#1d1a1c" fill-opacity=".13"/>
      <path d="M865 877 L880 886 M856 895 L872 904 M847 913 L862 922 M835 930 L851 939" ${line(5)} stroke-opacity=".45" fill="none"/>
      <path d="M838 822 Q826 808 810 806" fill="none" stroke="#fff" stroke-opacity=".6" stroke-width="10" stroke-linecap="round"/>
      <path d="M494 600 Q615 604 736 600 L758 652 Q615 688 472 652 Z" fill="${c}" ${line(9)}/><path d="M494 600 Q615 604 736 600 L758 652 Q615 688 472 652 Z" fill="#1d1a1c" fill-opacity=".13"/>
      <path d="M515 611 L515 652 M540 611 L540 656 M565 612 L565 659 M590 612 L590 660 M640 612 L640 660 M665 612 L665 659 M690 611 L690 656 M715 611 L715 652" ${line(5)} stroke-opacity=".45" fill="none"/>
      <path d="M615 612 L615 1072" fill="none" ${line(7)}/>
      <path d="M604 692 L626 692 M604 714 L626 714 M604 736 L626 736 M604 758 L626 758 M604 780 L626 780 M604 802 L626 802 M604 824 L626 824 M604 846 L626 846 M604 868 L626 868 M604 890 L626 890 M604 912 L626 912 M604 934 L626 934 M604 956 L626 956 M604 978 L626 978 M604 1000 L626 1000 M604 1022 L626 1022 M604 1044 L626 1044" fill="none" ${line(5)}/>
      <rect x="601" y="606" width="28" height="24" rx="8" fill="#f6d860" ${line(7)}/>
      <path d="M604 628 L626 628 L631 676 Q615 688 599 676 Z" fill="#f6d860" ${line(7)}/>
      <circle cx="615" cy="664" r="5" fill="#1d1a1c"/>
      <circle cx="706" cy="764" r="34" fill="#fff8e8" ${line(7)}/>
      <path d="M706 784 C674 762 690 736 706 754 C722 736 738 762 706 784 Z" fill="#f08aa4"/>`,

    // セーター（あたまから かぶる ニット）
    sweater: (c, o) => `${torso(c, 1040)}
      ${[[510, 642, 7], [615, 690, 6], [720, 642, 7]].map(([x, y, n]) => '<path d="M' + x + ' ' + y + [...Array(n)].map((_, i) => ' q' + (i % 2 ? -32 : 32) + ' 25 0 50').join('') + ' M' + x + ' ' + y + [...Array(n)].map((_, i) => ' q' + (i % 2 ? 32 : -32) + ' 25 0 50').join('') + '" fill="none" stroke="#fff" stroke-opacity=".6" stroke-width="11" stroke-linecap="round"/>').join('')}
      <path d="M562 664 L562 988 M668 664 L668 988" fill="none" stroke="#fff" stroke-opacity=".4" stroke-width="6" stroke-linecap="round"/>
      ${['M540 600 Q615 664 690 600 L718 600 Q615 716 512 600 Z', 'M444 1004 Q615 1022 788 1004 L792 1040 Q615 1058 438 1040 Z'].map(d => '<path d="' + d + '" fill="' + c + '" ' + line(9) + '/><path d="' + d + '" fill="' + INK + '" fill-opacity=".12"/>').join('')}
      <path d="M552 610L529 618M565 618L546 632M578 624L564 644M590 628L581 652M603 631L598 656M615 632L615 658M628 631L632 656M640 628L649 652M653 624L667 644M665 618L684 632M678 610L701 618 M462 1009L462 1039M484 1011L484 1041M506 1012L506 1043M528 1014L528 1044M550 1015L550 1045M572 1015L572 1045M594 1016L594 1046M616 1016L616 1046M638 1016L638 1046M660 1015L660 1045M682 1015L682 1045M704 1014L704 1044M726 1012L726 1042M748 1011L748 1041M770 1009L770 1039" fill="none" stroke="${INK}" stroke-opacity=".3" stroke-width="5" stroke-linecap="round"/>
      ${sleeves(c, o, true)}
      ${[false, true].filter(rt => rt || !o.noL).map(rt => {
        const X = x => rt ? 1230 - x : x;
        const d = 'M' + X(362) + ' 844 L' + X(340) + ' 866 L' + X(330) + ' 902 L' + X(334) + ' 930 L' + X(396) + ' 952 Z';
        const rib = [[364, 866, 345, 867], [368, 889, 339, 897], [374, 913, 343, 926], [385, 932, 370, 939]].map(([a, b, e, f]) => 'M' + X(a) + ' ' + b + ' L' + X(e) + ' ' + f).join(' ');
        return '<path d="' + d + '" fill="' + c + '" ' + line(9) + '/><path d="' + d + '" fill="' + INK + '" fill-opacity=".12"/>' +
          '<path d="' + rib + '" fill="none" stroke="' + INK + '" stroke-opacity=".3" stroke-width="5" stroke-linecap="round"/>';
      }).join('')}`,

    // カーディガン（前あきの ニット。中に 白い インナー）
    cardigan: (c, o) => `<path d="M516 600 L540 600 Q615 664 690 600 L714 600 L642 834 L588 834 Z" fill="#ffffff" ${line()}/>
      <path d="M556 612 Q615 684 674 612" fill="none" stroke="${INK}" stroke-opacity=".22" stroke-width="5" stroke-linecap="round"/>
      <path d="M${NECK_L} L540 600 L615 790 L690 600 L${NECK_R} L812 800 L778 906 L792 1060 Q615 1078 438 1060 L462 906 L424 800 Z" fill="${c}" ${line()}/>
      ${[0, 1].map(k => '<path d="M444 1022 Q615 1040 789 1022 L792 1060 Q615 1078 438 1060 Z" ' + (k ? 'fill="' + INK + '" fill-opacity=".12"' : 'fill="' + c + '" ' + line(9)) + '/>').join('')}
      <path d="${[...Array(15)].map((_, i) => 462 + i * 22).map(x => [x, 36 * ((x - 441) / 351) * (1 - (x - 441) / 351)]).map(([x, d]) => 'M' + x + ' ' + (1029 + d).toFixed(0) + ' L' + x + ' ' + (1053 + d).toFixed(0)).join(' ')}" fill="none" stroke="${INK}" stroke-opacity=".3" stroke-width="5" stroke-linecap="round"/>
      ${[[482, 560], [670, 748]].map(([a, b]) => '<path d="M' + a + ' 936 L' + b + ' 936 L' + (b - 2) + ' 998 Q' + (a + b) / 2 + ' 1012 ' + (a + 2) + ' 998 Z" fill="' + c + '" ' + line(8) + '/>' +
        '<path d="M' + (a + 4) + ' 940 L' + (b - 4) + ' 940 L' + (b - 4) + ' 956 L' + (a + 4) + ' 956 Z" fill="' + INK + '" fill-opacity=".12"/>' +
        '<path d="M' + (a + 2) + ' 958 L' + (b - 2) + ' 958" fill="none" ' + line(7) + '/>').join('')}
      ${[0, 1].map(k => '<path d="M506 600 L540 600 L615 790 L690 600 L724 600 L635 826 L635 1069 L595 1069 L595 826 Z" ' + (k ? 'fill="' + INK + '" fill-opacity=".12"' : 'fill="' + c + '" ' + line(8)) + '/>').join('')}
      <path d="M615 790 L615 1069" fill="none" ${line(7)}/>
      ${(bc => [830, 884, 938, 992].map(y => '<circle cx="615" cy="' + y + '" r="17" fill="' + bc + '" ' + line(7) + '/><circle cx="609" cy="' + y + '" r="3.4" fill="' + INK + '"/><circle cx="621" cy="' + y + '" r="3.4" fill="' + INK + '"/>').join(''))(((r, g, b) => r - g > 30 && b > g ? '#6f9fdc' : '#e9789c')(parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)))}
      <path d="M462 724 Q460 668 486 648" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="12" stroke-linecap="round"/>
      ${sleeves(c, o, true)}
      ${[false, true].filter(rt => rt || !o.noL).map(rt => {
        const X = x => rt ? 1230 - x : x;
        const d = 'M' + X(364) + ' 842 L' + X(340) + ' 866 L' + X(330) + ' 902 L' + X(334) + ' 930 L' + X(396) + ' 952 L' + X(410) + ' 946 Z';
        const rib = [[366, 864, 346, 868], [371, 886, 339, 896], [378, 908, 342, 922], [388, 930, 364, 940]].map(([a, b, e, f]) => 'M' + X(a) + ' ' + b + ' L' + X(e) + ' ' + f).join(' ');
        return '<path d="' + d + '" fill="' + c + '" ' + line(9) + '/><path d="' + d + '" fill="' + INK + '" fill-opacity=".12"/>' +
          '<path d="' + rib + '" fill="none" stroke="' + INK + '" stroke-opacity=".3" stroke-width="5" stroke-linecap="round"/>';
      }).join('')}`,

    yukata: (c, o) => `<path d="M${NECK_L} L548 600 L700 760 L${NECK_R} L812 800 L778 906 L800 1170 Q615 1186 430 1170 L462 906 L424 800 Z" fill="#cfe3f7" ${line()}/>
      <path d="M548 600 L460 1170" ${line(8)} fill="none"/>
      <path d="M682 600 L560 720" ${line(8)} fill="none"/>
      ${o.noL ? '' : `<path d="M428 800 L340 850 L330 1000 L420 1010 L462 930 Z" fill="#cfe3f7" ${line()}/>`}
      <path d="M802 800 L890 850 L900 1000 L810 1010 L768 930 Z" fill="#cfe3f7" ${line()}/>
      <path d="M452 950 L778 950 L782 1010 L448 1010 Z" fill="#f08aa4" ${line(9)}/>
      ${[[520, 680], [690, 860], [540, 1080], [720, 1100], [620, 1140], [870, 940], [370, 950]].map(([x, y]) => (o.noL && x < 400) ? '' : `<g fill="#f6a5bd">${[0, 72, 144, 216, 288].map(a => `<circle cx="${x + Math.cos(a * Math.PI / 180) * 14}" cy="${y + Math.sin(a * Math.PI / 180) * 14}" r="11"/>`).join('')}<circle cx="${x}" cy="${y}" r="7" fill="#f6d860"/></g>`).join('')}`,

    tutu: (c, o) => `<path d="M${NECK_L} L540 600 Q615 664 690 600 L${NECK_R} L812 800 L778 906 L786 1060 L444 1060 L462 906 L424 800 Z" fill="#f7b6cd" ${line()}/>
      <ellipse cx="615" cy="1060" rx="290" ry="58" fill="#fde3ec" ${line()}/>
      <path d="M335 1060 q35 40 70 4 q35 40 70 4 q35 40 70 4 q35 40 70 4 q35 40 70 4 q35 40 70 4 q35 40 70 4 q35 40 70 4" fill="none" ${line(8)}/>
      <path d="M380 1050 Q615 1010 850 1050" fill="none" stroke="#f7b6cd" stroke-width="16" stroke-linecap="round"/>
      ${star(615, 680, 26, '#fff')}`,

    gown: (c, o) => `${skirt(c, 970, 1170, 260, true)}
      <path d="M440 1040 Q615 1080 790 1040 M400 1110 Q615 1150 830 1110" fill="none" stroke="#fff" stroke-opacity=".6" stroke-width="10"/>
      ${torso(c, 990)}${o.noL ? '' : `<path d="M428 800 C380 790 340 830 352 870 C370 900 430 900 462 880 Z" fill="${c}" ${line()}/>`}
      <path d="M802 800 C850 790 890 830 878 870 C860 900 800 900 768 880 Z" fill="${c}" ${line()}/>
      <path d="M462 980 Q615 1000 768 980" fill="none" ${line(9)}/>
      ${star(615, 980, 30, '#f6d860')}
      <circle cx="615" cy="690" r="18" fill="#fff" ${line(6)}/>`,

    cape: (c, o) => `<path d="M${NECK_L} L520 600 L560 700 L520 1150 L380 1150 L360 860 Z" fill="#6b4a9e" ${line()}/>
      <path d="M${NECK_R} L710 600 L670 700 L710 1150 L850 1150 L870 860 Z" fill="#6b4a9e" ${line()}/>
      <path d="M520 600 L560 700 L540 1000 L500 820 Z M710 600 L670 700 L690 1000 L730 820 Z" fill="#f4a24a"/>
      <path d="M430 600 L520 560 L615 620 L710 560 L802 600 L760 650 L615 640 L470 650 Z" fill="#6b4a9e" ${line(9)}/>
      ${star(450, 1000, 22, '#f6d860')}${star(780, 950, 18, '#f6d860')}${star(800, 1080, 14, '#f6d860')}`,

    santasuit: (c, o) => `${torso('#e5484d', 1060)}${sleeves('#e5484d', o)}
      <path d="M436 1030 Q615 1060 794 1030 L796 1078 Q615 1110 434 1078 Z" fill="#fffaf2" ${line(9)}/>
      <path d="M455 960 L776 960 L780 1000 L452 1000 Z" fill="#2c2628" ${line(7)}/>
      <rect x="585" y="952" width="60" height="56" rx="8" fill="#f6d860" ${line(7)}/>
      <path d="M540 600 Q615 664 690 600 L690 640 Q615 700 540 640 Z" fill="#fffaf2" ${line(8)}/>
      ${button(615, 760, '#fffaf2')}${button(615, 860, '#fffaf2')}`
  };

  /* id の服を c（色）で描く */
  function markup(id, color, opts) {
    const f = ART[id];
    return f ? `<g>${f(color, opts || {})}</g>` : '';
  }
  return { markup, has: (id) => !!ART[id], ids: () => Object.keys(ART) };
})();
