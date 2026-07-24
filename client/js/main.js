// 导入 NodeCrypt 模块（加密功能模块）
// Import the NodeCrypt module (used for encryption)
import './NodeCrypt.js';



// 从 util.image.js 中导入图片处理功能
// Import image processing functions from util.image.js
import {
	setupImagePaste
} from './util.image.js';

// 从 util.emoji.js 中导入设置表情选择器的函数
// Import setupEmojiPicker function from util.emoji.js
import {
	setupEmojiPicker
} from './util.emoji.js';

// 从 util.settings.js 中导入设置面板的功能函数
// Import functions for settings panel from util.settings.js
import {
	openSettingsPanel,   // 打开设置面板 / Open settings panel
	closeSettingsPanel,  // 关闭设置面板 / Close settings panel
	initSettings,         // 初始化设置 / Initialize settings
	notifyMessage         // 通知信息提示 / Display notification message
} from './util.settings.js';
import { t, updateStaticTexts } from './util.i18n.js';

// 从 util.theme.js 中导入主题功能函数
// Import theme functions from util.theme.js
import {
	initTheme            // 初始化主题 / Initialize theme
} from './util.theme.js';

// 从 util.dom.js 中导入常用 DOM 操作函数
// Import common DOM manipulation functions from util.dom.js
import {
	$,         // 简化的 document.querySelector / Simplified selector
	$id,       // document.getElementById 的简写 / Shortcut for getElementById
	removeClass // 移除类名 / Remove a CSS class
} from './util.dom.js';

// 从 room.js 中导入房间管理相关变量和函数
// Import room-related variables and functions from room.js
import {
	roomsData,         // 当前所有房间的数据 / Data of all rooms
	activeRoomIndex,   // 当前激活的房间索引 / Index of the active room
	joinRoom           // 加入房间的函数 / Function to join a room
} from './room.js';

// 从 chat.js 中导入聊天功能相关的函数
// Import chat-related functions from chat.js
import {
	addMsg,               // 添加普通消息到聊天窗口 / Add a normal message to chat
	addOtherMsg,          // 添加其他用户消息 / Add message from other users
	addSystemMsg,         // 添加系统消息 / Add a system message
	setupImagePreview,    // 设置图片预览功能 / Setup image preview
	setupInputPlaceholder, // 设置输入框的占位提示 / Setup placeholder for input box
	autoGrowInput         // 自动调整输入框高度 / Auto adjust input height
} from './chat.js';

// 从 ui.js 中导入 UI 界面相关的功能
// Import user interface functions from ui.js
import {	renderUserList,       // 渲染用户列表 / Render user list
	renderMainHeader,     // 渲染主标题栏 / Render main header
	setupMoreBtnMenu,     // 设置更多按钮的下拉菜单 / Setup "more" button menu
	preventSpaceInput,    // 防止输入空格 / Prevent space input in form fields
	loginFormHandler,     // 登录表单提交处理器 / Login form handler
	openLoginModal,       // 打开登录窗口 / Open login modal
	setupTabs,            // 设置页面标签切换 / Setup tab switching
	autofillRoomPwd,      // 自动填充房间密码 / Autofill room password
	generateLoginForm,    // 生成登录表单HTML / Generate login form HTML
	initLoginForm,        // 初始化登录表单 / Initialize login form
	initFlipCard          // 初始化翻转卡片功能 / Initialize flip card functionality
} from './ui.js';

// 设置全局配置参数
// Set global configuration parameters
window.config = {
	wsAddress: `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws/`, // WebSocket 服务器地址 / WebSocket server address
	//wsAddress: `wss://crypt.works`,
	debug: true                       // 是否开启调试模式 / Enable debug mode
};

// 在文档开始加载前就初始化语言设置，防止闪烁
// Initialize language settings before document starts loading
initSettings();
updateStaticTexts();

// 把一些函数挂载到 window 对象上供其他模块使用
// Expose functions to the global window object for accessibility
window.addSystemMsg = addSystemMsg;
window.addOtherMsg = addOtherMsg;
window.joinRoom = joinRoom;
window.notifyMessage = notifyMessage;
window.setupEmojiPicker = setupEmojiPicker;

// 当 DOM 内容加载完成后执行初始化逻辑
// Run initialization logic when the DOM content is fully loaded
window.addEventListener('DOMContentLoaded', () => {
	// 移除预加载样式类，允许过渡效果
	// Remove preload class to allow transitions
	setTimeout(() => {
		document.body.classList.remove('preload');
	}, 300);
	
	// 初始化登录表单 / Initialize login form
	initLoginForm();

	const loginForm = $id('login-form');               // 登录表单 / Login form

	if (loginForm) {
		// 监听登录表单提交事件 / Listen to login form submission
		loginForm.addEventListener('submit', loginFormHandler(null))
	}

	const joinBtn = $('.join-room'); // 加入房间按钮 / Join room button
	if (joinBtn) {
		joinBtn.onclick = openLoginModal; // 点击打开登录窗口 / Click to open login modal
	}
	// 阻止用户输入用户名、房间名和密码时输入空格
	// Prevent space input for username, room name, and password fields
	preventSpaceInput($id('userName'));
	preventSpaceInput($id('roomName'));
	preventSpaceInput($id('password'));
	
	// 初始化翻转卡片功能 / Initialize flip card functionality
	initFlipCard();
	
	// 初始化辅助功能和界面设置
	// Initialize autofill, input placeholders, and menus
	autofillRoomPwd();	setupInputPlaceholder();
	setupMoreBtnMenu();
	setupImagePreview();	setupEmojiPicker();
	// 由于我们已经在DOM加载前预先初始化了语言设置，这里不需要重复初始化
	// initSettings();
	// updateStaticTexts(); // 在初始化设置后更新静态文本 / Update static texts after initializing settings
	initTheme(); // 初始化主题 / Initialize theme
	
	const settingsBtn = $id('settings-btn'); // 设置按钮 / Settings button
	if (settingsBtn) {
		settingsBtn.onclick = (e) => {
			e.stopPropagation();  // 阻止事件冒泡 / Stop event from bubbling
			openSettingsPanel(); // 打开设置面板 / Open settings panel
		}
	}

	// 设置返回按钮事件处理 / Settings back button event handler
	const settingsBackBtn = $id('settings-back-btn');
	if (settingsBackBtn) {
		settingsBackBtn.onclick = (e) => {
			e.stopPropagation();
			closeSettingsPanel(); // 关闭设置面板 / Close settings panel
		}
	}
	// 点击其他地方时关闭设置面板 (已移除，因为现在使用侧边栏形式)
	// Close settings panel when clicking outside (removed since we now use sidebar format)
	const input = document.querySelector('.input-message-input'); // 消息输入框 / Message input box
	
	// 设置图片粘贴功能
	// Setup image paste functionality
	const imagePasteHandler = setupImagePaste('.input-message-input');
	
	if (input) {
		input.focus(); // 自动聚焦 / Auto focus
		input.addEventListener('keydown', (e) => {
			// 按下 Enter 键并且不按 Shift，表示发送消息
			// Pressing Enter (without Shift) sends the message
			if (e.key === 'Enter' && !e.shiftKey) {
				e.preventDefault();
				sendMessage();
			}
			// 支持 Ctrl+A 全选文本
			// Support Ctrl+A for selecting all text
			if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
				e.preventDefault();
				const selection = window.getSelection();
				const range = document.createRange();
				range.selectNodeContents(input);
				selection.removeAllRanges();
				selection.addRange(range);
			}
		});
	}
	
	// 发送消息的统一函数
	// Unified function to send messages
	function sendMessage() {
		const text = input.innerText.trim(); // 获取输入的文本 / Get input text
		const images = imagePasteHandler ? imagePasteHandler.getCurrentImages() : []; // 获取所有图片

		if (!text && images.length === 0) return; // 如果没有文本且没有图片，则不发送
		const rd = roomsData[activeRoomIndex]; // 当前房间数据 / Current room data
		
		if (rd && rd.chat) {
			if (images.length > 0) {
				// 发送包含图片的消息 (支持多图和文字合并)
				// Send message with images (supports multiple images and text combined)
				const messageContent = {
					text: text || '', // 包含文字内容，如果有的话
					images: images    // 包含所有图片数据
				};

				if (rd.privateChatTargetId) {
					// 私聊图片消息加密并发送
					// Encrypt and send private image message
					const targetClient = rd.chat.channel[rd.privateChatTargetId];
					if (targetClient && targetClient.shared) {
						const clientMessagePayload = {
							a: 'm',
							t: 'image_private',
							d: messageContent
						};
						const encryptedClientMessage = rd.chat.encryptClientMessage(clientMessagePayload, targetClient.shared);
						const serverRelayPayload = {
							a: 'c',
							p: encryptedClientMessage,
							c: rd.privateChatTargetId
						};
						const encryptedMessageForServer = rd.chat.encryptServerMessage(serverRelayPayload, rd.chat.serverShared);						rd.chat.sendMessage(encryptedMessageForServer);
						addMsg(messageContent, false, 'image_private');
					} else {
						addSystemMsg(`${t('system.private_message_failed', 'Cannot send private message to')} ${rd.privateChatTargetName}. ${t('system.user_not_connected', 'User might not be fully connected.')}`)
					}
				} else {
					// 公共频道图片消息发送
					// Send image message to public channel
					rd.chat.sendChannelMessage('image', messageContent);
					addMsg(messageContent, false, 'image');
				}
				
				imagePasteHandler.clearImages(); // 清除所有图片预览
			} else if (text) {
				// 发送纯文本消息
				// Send text-only message
				if (rd.privateChatTargetId) {
					// 私聊消息加密并发送
					// Encrypt and send private message
					const targetClient = rd.chat.channel[rd.privateChatTargetId];
					if (targetClient && targetClient.shared) {
						const clientMessagePayload = {
							a: 'm',
							t: 'text_private',
							d: text
						};
						const encryptedClientMessage = rd.chat.encryptClientMessage(clientMessagePayload, targetClient.shared);
						const serverRelayPayload = {
							a: 'c',
							p: encryptedClientMessage,
							c: rd.privateChatTargetId
						};
						const encryptedMessageForServer = rd.chat.encryptServerMessage(serverRelayPayload, rd.chat.serverShared);
						rd.chat.sendMessage(encryptedMessageForServer);					addMsg(text, false, 'text_private');
					} else {
						addSystemMsg(`${t('system.private_message_failed', 'Cannot send private message to')} ${rd.privateChatTargetName}. ${t('system.user_not_connected', 'User might not be fully connected.')}`)
					}
				} else {
					// 公共频道消息发送
					// Send public message
					rd.chat.sendChannelMessage('text', text);
					addMsg(text);				}
			}
			
			// 清空输入框并触发 input 事件
			// Clear input and trigger input event
			input.innerHTML = ''; // 清空输入框内容 / Clear input field content
			if (imagePasteHandler && typeof imagePasteHandler.refreshPlaceholder === 'function') {
				imagePasteHandler.refreshPlaceholder(); // 更新 placeholder 状态
			}
			autoGrowInput(); // 调整输入框高度
		}
	}
	
	// 为发送按钮添加点击事件
	// Add click event for send button
	const sendButton = document.querySelector('.send-message-btn');
	if (sendButton) {
		sendButton.addEventListener('click', sendMessage);
	}
	
	// 判断是否为移动端
	// Check if the device is mobile
	const isMobile = () => window.innerWidth <= 768;

	// 渲染主界面元素
	// Render main UI elements
	renderMainHeader();
	renderUserList();
	setupTabs();

	const roomList = $id('room-list');
	const sidebar = $id('sidebar');
	const rightbar = $id('rightbar');
	const sidebarMask = $id('mobile-sidebar-mask');
	const rightbarMask = $id('mobile-rightbar-mask');

	// 在移动端点击房间列表后关闭侧边栏
	// On mobile, clicking room list closes sidebar
	if (roomList) {
		roomList.addEventListener('click', () => {
			if (isMobile()) {
				sidebar?.classList.remove('mobile-open');
				sidebarMask?.classList.remove('active');
			}
		});
	}

	// 在移动端点击成员标签后关闭右侧面板
	// On mobile, clicking member tabs closes right panel
	const memberTabs = $id('member-tabs');
	if (memberTabs) {
		memberTabs.addEventListener('click', () => {
			if (isMobile()) {
				removeClass(rightbar, 'mobile-open');
				removeClass(rightbarMask, 'active');
			}
		});
	}
});

// Listen for language change events
// 监听语言切换事件
window.addEventListener('languageChange', (event) => {
	updateStaticTexts();
});

// 禁止Print Screen键
// Disable Print Screen key
document.addEventListener('keydown', (e) => {
	if (e.key === 'PrintScreen' || e.key === 'Snapshot' || e.key === 'Print') {
		e.preventDefault();
		return false;
	}
});

// 重写Canvas API，防止截图
// Override Canvas API to prevent screenshots
const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
HTMLCanvasElement.prototype.toDataURL = function() {
	// 返回空图片数据URL
	return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
};

const originalGetImageData = CanvasRenderingContext2D.prototype.getImageData;
CanvasRenderingContext2D.prototype.getImageData = function() {
	// 返回空ImageData
	return new ImageData(new Uint8ClampedArray(0), 0, 0);
};

const originalToBlob = HTMLCanvasElement.prototype.toBlob;
HTMLCanvasElement.prototype.toBlob = function(callback) {
	// 返回空Blob
	callback(new Blob([], {type: 'image/png'}));
};

// 处理HTML2Canvas截图
// Handle HTML2Canvas screenshots
window.html2canvas = function() {
	return new Promise((resolve) => {
		// 返回空canvas元素
		const canvas = document.createElement('canvas');
		resolve(canvas);
	});
};

// 禁止右键菜单复制
// Disable right-click menu for copy
document.addEventListener('contextmenu', (e) => {
	const target = e.target;
	if (!target.closest('.input-message-input')) {
		e.preventDefault();
		return false;
	}
});

// 禁止Ctrl+C复制（除聊天输入框外）
// Disable Ctrl+C copy (except chat input)
document.addEventListener('keydown', (e) => {
	if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
		const target = e.target;
		if (!target.closest('.input-message-input')) {
			e.preventDefault();
			return false;
		}
	}
});

// 页面模糊效果处理
// Page blur effect handling
function blurPage() {
	console.log('Blur page triggered');
	document.body.classList.add('page-blur');
	// 确保添加到所有相关容器
	document.getElementById('login-container')?.classList.add('page-blur');
	document.getElementById('chat-container')?.classList.add('page-blur');
}

function unblurPage() {
	console.log('Unblur page triggered');
	document.body.classList.remove('page-blur');
	// 确保移除所有相关容器的模糊效果
	document.getElementById('login-container')?.classList.remove('page-blur');
	document.getElementById('chat-container')?.classList.remove('page-blur');
}

// 实时检测鼠标是否在页面上
// Real-time detection of mouse presence on page
let isMouseOnPage = true;

// 监听鼠标移动和离开事件
// Listen for mouse movement and leave events
window.addEventListener('mousemove', () => {
	if (!isMouseOnPage) {
		console.log('Mouse returned to page - unblur');
		isMouseOnPage = true;
		unblurPage();
	}
});

window.addEventListener('mouseenter', () => {
	console.log('Mouse entered page - unblur');
	isMouseOnPage = true;
	unblurPage();
});

window.addEventListener('mouseleave', () => {
	console.log('Mouse left page - blur');
	isMouseOnPage = false;
	blurPage();
});

// 监听鼠标离开浏览器窗口区域
// Listen for mouse leaving browser window area
window.addEventListener('mouseout', (e) => {
	// 检查鼠标是否真的离开了页面
	if (e.toElement === null && e.relatedTarget === null) {
		console.log('Mouse out of window - blur');
		isMouseOnPage = false;
		blurPage();
	}
});

// 监听页面可见性变化（页面切换、最小化）
// Listen for page visibility change (page switch, minimize)
document.addEventListener('visibilitychange', () => {
	console.log('Visibility change:', document.hidden);
	if (document.hidden) {
		blurPage();
	} else {
		unblurPage();
	}
});

// 监听窗口失焦
// Listen for window blur
window.addEventListener('blur', () => {
	console.log('Window blur - blur');
	blurPage();
});

window.addEventListener('focus', () => {
	console.log('Window focus - unblur');
	unblurPage();
});

// 监听屏幕共享
// Listen for screen sharing
if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
	const originalGetDisplayMedia = navigator.mediaDevices.getDisplayMedia;
	navigator.mediaDevices.getDisplayMedia = async function(constraints) {
		console.log('Screen sharing started');
		blurPage();
		try {
			const stream = await originalGetDisplayMedia.apply(this, arguments);
			// 监听流结束事件，取消模糊
			const tracks = stream.getTracks();
			tracks.forEach(track => {
				track.addEventListener('ended', () => {
					console.log('Screen sharing ended');
					unblurPage();
				});
			});
			return stream;
		} catch (error) {
			console.log('Screen sharing failed');
			unblurPage();
			throw error;
		}
	};
}


