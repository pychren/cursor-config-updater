const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');

// 获取所有可能的 Cursor 配置文件路径
function getAllCursorConfigPaths() {
    const homeDir = os.homedir();
    const platform = process.platform;
    const paths = [];

    // Windows 路径
    if (platform === 'win32') {
        paths.push(path.join(homeDir, 'AppData', 'Roaming', 'Cursor', 'User', 'settings.json'));
        paths.push(path.join(homeDir, 'AppData', 'Local', 'Cursor', 'User', 'settings.json'));
    }
    // macOS 路径
    else if (platform === 'darwin') {
        paths.push(path.join(homeDir, 'Library', 'Application Support', 'Cursor', 'User', 'settings.json'));
        paths.push(path.join(homeDir, 'Library', 'Preferences', 'Cursor', 'User', 'settings.json'));
    }
    // Linux 路径
    else {
        paths.push(path.join(homeDir, '.config', 'Cursor', 'User', 'settings.json'));
        paths.push(path.join(homeDir, '.local', 'share', 'Cursor', 'User', 'settings.json'));
    }

    return paths;
}

// 生成新的用户指纹
function generateFingerprint() {
    const timestamp = Date.now();
    const random = crypto.randomBytes(16).toString('hex');
    return `${timestamp}-${random}`;
}

// 生成新的设备ID
function generateDeviceId() {
    const timestamp = Date.now();
    const random = crypto.randomBytes(8).toString('hex');
    const machineId = os.hostname().replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    return `${machineId}-${timestamp}-${random}`;
}

// 更新单个配置文件
function updateSingleConfig(configPath) {
    try {
        // 读取现有配置
        let config = {};
        if (fs.existsSync(configPath)) {
            const configContent = fs.readFileSync(configPath, 'utf8');
            config = JSON.parse(configContent);
        }

        // 更新用户指纹和设备ID
        config.userFingerprint = generateFingerprint();
        config.deviceId = generateDeviceId();

        // 添加其他相关配置
        config.telemetry = {
            enabled: true,
            lastUpdate: new Date().toISOString()
        };

        // 确保目录存在
        const configDir = path.dirname(configPath);
        if (!fs.existsSync(configDir)) {
            fs.mkdirSync(configDir, { recursive: true });
        }

        // 写入更新后的配置
        fs.writeFileSync(configPath, JSON.stringify(config, null, 4));
        console.log(`成功更新配置文件: ${configPath}`);
        console.log('新的用户指纹:', config.userFingerprint);
        console.log('新的设备ID:', config.deviceId);
        return true;
    } catch (error) {
        console.error(`更新配置文件 ${configPath} 时出错:`, error.message);
        return false;
    }
}

// 扫描并更新所有配置文件
function scanAndUpdateConfigs() {
    const configPaths = getAllCursorConfigPaths();
    let updatedCount = 0;
    let errorCount = 0;

    console.log('开始扫描 Cursor 配置文件...');

    for (const configPath of configPaths) {
        if (fs.existsSync(configPath)) {
            console.log(`找到配置文件: ${configPath}`);
            if (updateSingleConfig(configPath)) {
                updatedCount++;
            } else {
                errorCount++;
            }
        }
    }

    // 如果没有找到任何配置文件，创建默认配置
    if (updatedCount === 0 && errorCount === 0) {
        const defaultPath = configPaths[0];
        console.log('未找到现有配置文件，创建新的配置文件...');
        if (updateSingleConfig(defaultPath)) {
            updatedCount++;
        }
    }

    console.log('\n更新完成！');
    console.log(`成功更新: ${updatedCount} 个文件`);
    console.log(`更新失败: ${errorCount} 个文件`);
}

// 执行更新
scanAndUpdateConfigs(); 