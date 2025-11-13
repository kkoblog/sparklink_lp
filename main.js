// シンプルな2Dスワイプナビゲーション（モバイル専用）
(function () {
	'use strict';

	/** 座標系：x(右+), y(下+)。中心(0,0)からの相対位置 */
	const definedNodes = new Set([
		'0,0',   // ホーム（FV）
		'0,-1',  // 上：スタッフ
		'0,-2',  // 上2：スタッフ2
		'1,0',   // 右：サービス
		'2,0',   // 右2：サービス2
		'-1,0',  // 左：実績
		'-2,0',  // 左2：実績2
		'0,1',   // 下：特徴（動画）
		'0,2',   // 下2：特徴（動画）2
	]);

	const viewport = document.getElementById('viewport');
	const videoEl = document.getElementById('feature-video');
	const videoEl2 = document.getElementById('feature-video-2');
	const staffVideoEl = document.getElementById('staff-video');
	const hud = {
		left: document.querySelector('.dot-left'),
		right: document.querySelector('.dot-right'),
		up: document.querySelector('.dot-up'),
		down: document.querySelector('.dot-down')
	};

	let current = { x: 0, y: 0 };
	let isAnimating = false;

	// 動画の準備（サンプル動画の埋め込み：ユーザー側で差し替えを推奨）
	setupVideo();
	function setupVideo() {
		// 1つ目の動画
		if (videoEl) {
			videoEl.setAttribute('muted', 'muted');
			videoEl.muted = true;
			videoEl.addEventListener('click', () => {
				if (videoEl.paused) {
					videoEl.play().catch(() => {/* autoplay制限時は無視 */});
				} else {
					videoEl.pause();
				}
			});
		}
		// 2つ目の動画
		if (videoEl2) {
			videoEl2.setAttribute('muted', 'muted');
			videoEl2.muted = true;
			videoEl2.addEventListener('click', () => {
				if (videoEl2.paused) {
					videoEl2.play().catch(() => {/* autoplay制限時は無視 */});
				} else {
					videoEl2.pause();
				}
			});
		}
		// スタッフ動画
		if (staffVideoEl) {
			staffVideoEl.setAttribute('muted', 'muted');
			staffVideoEl.muted = true;
			staffVideoEl.addEventListener('click', () => {
				if (staffVideoEl.paused) {
					staffVideoEl.play().catch(() => {/* autoplay制限時は無視 */});
				} else {
					staffVideoEl.pause();
				}
			});
		}
	}

	// HUD更新
	function updateHud() {
		const avail = neighbors(current);
		hud.left && hud.left.classList.toggle('is-active', !!avail.left);
		hud.right && hud.right.classList.toggle('is-active', !!avail.right);
		hud.up && hud.up.classList.toggle('is-active', !!avail.up);
		hud.down && hud.down.classList.toggle('is-active', !!avail.down);
	}
	updateHud();

	// 近傍ノードの存在を確認
	function neighbors(pos) {
		return {
			left: definedNodes.has(`${pos.x - 1},${pos.y}`),
			right: definedNodes.has(`${pos.x + 1},${pos.y}`),
			up: definedNodes.has(`${pos.x},${pos.y - 1}`),
			down: definedNodes.has(`${pos.x},${pos.y + 1}`),
		};
	}

	// スワイプ処理
	let touchStart = null;
	const SWIPE_MIN_PX = 40; // スワイプ判定の距離
	const SWIPE_ANGLE_RATIO = 1.2; // 縦横の優先度

	viewport.addEventListener('touchstart', (e) => {
		if (isAnimating) return;
		const t = e.changedTouches[0];
		touchStart = { x: t.clientX, y: t.clientY, t: Date.now() };
	}, { passive: true });

	viewport.addEventListener('touchmove', (e) => {
		// transformのプレビューなどは今回は実装しない（シンプルさ優先）
	}, { passive: true });

	viewport.addEventListener('touchend', (e) => {
		if (isAnimating || !touchStart) return;
		const t = e.changedTouches[0];
		const dx = t.clientX - touchStart.x;
		const dy = t.clientY - touchStart.y;
		const adx = Math.abs(dx);
		const ady = Math.abs(dy);
		let dir = null;
		if (adx > ady * SWIPE_ANGLE_RATIO && adx > SWIPE_MIN_PX) {
			dir = dx > 0 ? 'right' : 'left';
		} else if (ady > adx * SWIPE_ANGLE_RATIO && ady > SWIPE_MIN_PX) {
			dir = dy > 0 ? 'down' : 'up';
		}
		if (dir) navigate(dir);
		touchStart = null;
	}, { passive: true });

	function navigate(direction) {
		const next = { x: current.x, y: current.y };
		// スワイプ方向を逆にする（矢印の方向とは逆にスワイプ）
		if (direction === 'left') next.x += 1;  // 左にスワイプ → 右方向のセクションへ
		if (direction === 'right') next.x -= 1;  // 右にスワイプ → 左方向のセクションへ
		if (direction === 'up') next.y += 1;  // 上にスワイプ → 下方向のセクションへ
		if (direction === 'down') next.y -= 1;  // 下にスワイプ → 上方向のセクションへ
		const key = `${next.x},${next.y}`;
		if (!definedNodes.has(key)) return;
		animateTo(next);
	}

	function animateTo(target) {
		isAnimating = true;
		viewport.classList.add('is-animating');
		// 中心(0,0)を基準に、逆方向へビューポートを移動
		const tx = -(target.x * window.innerWidth);
		const ty = -(target.y * window.innerHeight);
		viewport.style.transform = `translate3d(${tx}px, ${ty}px, 0)`;
		setTimeout(() => {
			current = target;
			viewport.classList.remove('is-animating');
			isAnimating = false;
			updateHud();
			handleMediaAutoplay(target);
		}, 520);
	}

	// 動画の自動再生/停止（視認時のみ）
	function handleMediaAutoplay(pos) {
		const onVideo1 = pos.x === 0 && pos.y === 1;
		const onVideo2 = pos.x === 0 && pos.y === 2;
		const onStaffVideo = pos.x === 0 && pos.y === -1;
		if (videoEl) {
			if (onVideo1) {
				videoEl.play().catch(() => {/* サイレント失敗 */});
			} else {
				if (!videoEl.paused) videoEl.pause();
			}
		}
		if (videoEl2) {
			if (onVideo2) {
				videoEl2.play().catch(() => {/* サイレント失敗 */});
			} else {
				if (!videoEl2.paused) videoEl2.pause();
			}
		}
		if (staffVideoEl) {
			if (onStaffVideo) {
				staffVideoEl.play().catch(() => {/* サイレント失敗 */});
			} else {
				if (!staffVideoEl.paused) staffVideoEl.pause();
			}
		}
	}

	// 画面回転・リサイズ時は現在位置を再計算
	window.addEventListener('resize', () => {
		const tx = -(current.x * window.innerWidth);
		const ty = -(current.y * window.innerHeight);
		viewport.style.transform = `translate3d(${tx}px, ${ty}px, 0)`;
	}, { passive: true });
})();


