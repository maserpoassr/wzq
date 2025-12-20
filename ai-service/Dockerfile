# Gomoku AI Service - Docker 部署文件
# 基于 PyTorch 的 AlphaZero 五子棋 AI 服务
FROM python:3.10-slim

# 设置工作目录
WORKDIR /app

# 安装系统依赖
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# 复制依赖文件
COPY requirements.txt ./

# 安装 Python 依赖 (CPU 版本 PyTorch)
RUN pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu \
    && pip install --no-cache-dir -r requirements.txt

# 复制源代码
COPY *.py ./
COPY config.yaml ./

# 创建模型目录
RUN mkdir -p models

# 暴露端口
EXPOSE 5001

# 设置环境变量
ENV PYTHONUNBUFFERED=1
ENV AI_CONFIG_PATH=config.yaml

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:5001/health || exit 1

# 启动命令
CMD ["python", "app.py"]
