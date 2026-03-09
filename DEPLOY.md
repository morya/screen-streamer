# 部署记录

## 远程仓库
- **URL**: `git@git.gouboyun.tv:live/screen-streamer.git`
- **分支**: `master`
- **SSH 密钥**: `.ssh/id_rsa`

## 推送命令

```bash
cd /app/working/screen-streamer

# 使用指定 SSH 密钥推送
GIT_SSH_COMMAND="ssh -i $(pwd)/.ssh/id_rsa -o IdentitiesOnly=yes -o StrictHostKeyChecking=no" git push

# 或配置后直接推送
git push origin master
```

## 首次推送
- 时间：2025-03-09
- 提交：72e8c5f feat: 初始版本 - Electron 桌面抓屏推流工具
- 状态：✅ 成功

## SSH 密钥说明
- 私钥位置：`.ssh/id_rsa`
- 权限：600 (仅所有者可读写)
- ⚠️ 请勿将私钥提交到版本控制

## 注意事项
1. `.ssh/` 目录已在 `.gitignore` 中，不会被提交
2. 首次连接会自动添加主机密钥到 known_hosts
3. 如更换密钥，需更新远程服务器上的公钥
