# ====== IMPORTS ======
import numpy as np
import pandas as pd

# 模型
from xgboost import XGBRegressor
from lightgbm import LGBMRegressor
from sklearn.neighbors import KNeighborsRegressor
from sklearn.linear_model import ElasticNet
from sklearn.ensemble import (
    GradientBoostingRegressor,
    RandomForestRegressor,
    RandomForestClassifier,
    StackingRegressor,
)
from sklearn.svm import SVR
from sklearn.model_selection import train_test_split, cross_val_predict
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import (
    mean_absolute_error,
    mean_squared_error,
    r2_score,
    accuracy_score,
)
from joblib import dump

# ====== 1. 数据加载与预处理 ======
data = pd.read_excel(r"backend/analysis/detect_model/src/dataset.xlsx")
# 假定前面所有列为特征，倒数2个分别是分类和回归目标
X = data.iloc[:, :-2].values  # 特征
y1 = data.iloc[:, -2].values  # 分类目标
y2 = data.iloc[:, -1].values  # 回归目标

# 标准化特征
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

# 数据集分割（分类目标分层）
X_train, X_test, y1_train, y1_test, y2_train, y2_test = train_test_split(
    X_scaled, y1, y2, test_size=0.2, stratify=y1, random_state=42
)

train_center = np.mean(X_train, axis=0)  # 均值
train_cov = np.cov(X_train, rowvar=False)  # 协方差
train_min = np.min(X_train, axis=0)
train_max = np.max(X_train, axis=0)
ood_dict = {
    "center": train_center,
    "cov": train_cov,
    "min": train_min,
    "max": train_max,
}
dump(ood_dict, "backend/analysis/detect_model/train_ood_stats.joblib")

# ====== 2. 阶段一：分类器生成概率特征 ======
clf = RandomForestClassifier(n_estimators=100, class_weight="balanced", random_state=42)

# 10折交叉验证获得训练集概率（防止泄漏）
y1_proba_train = cross_val_predict(
    clf, X_train, y1_train, cv=10, method="predict_proba", n_jobs=-1
)

# 用全训练集fit分类器
clf.fit(X_train, y1_train)
# 在测试集上生成概率特征
y1_proba_test = clf.predict_proba(X_test)

# 拼接特征+分类概率得增强特征
X_train_aug = np.hstack([X_train, y1_proba_train])
X_test_aug = np.hstack([X_test, y1_proba_test])

# ====== 3. 阶段二：Stacking回归 ======
base_models = [
    (
        "rf",
        RandomForestRegressor(
            n_estimators=200, max_depth=9, min_samples_leaf=3, random_state=42
        ),
    ),
    (
        "xgb",
        XGBRegressor(
            n_estimators=150,
            max_depth=5,
            learning_rate=0.1,
            subsample=0.8,
            colsample_bytree=0.8,
            random_state=42,
        ),
    ),
    (
        "lgbm",
        LGBMRegressor(
            n_estimators=200,
            max_depth=6,
            learning_rate=0.05,
            reg_alpha=0.1,
            reg_lambda=0.1,
            random_state=42,
        ),
    ),
    ("elastic", ElasticNet(alpha=0.01, l1_ratio=0.5, max_iter=2000, random_state=42)),
    ("svr_rbf", SVR(kernel="rbf", C=2.0, epsilon=0.05, gamma="scale")),
    ("svr_poly", SVR(kernel="poly", degree=2, C=1.5, coef0=0.5)),
    ("knn", KNeighborsRegressor(n_neighbors=7, weights="distance", p=1)),
]

final_meta_model = GradientBoostingRegressor(
    n_estimators=200, learning_rate=0.16, max_depth=3, subsample=0.4, random_state=42
)

stacking_reg = StackingRegressor(
    estimators=base_models,
    final_estimator=final_meta_model,
    cv=10,
    passthrough=True,
    n_jobs=-1,
    verbose=1,
)

# 训练Stacking回归器
stacking_reg.fit(X_train_aug, y2_train)

# ====== 4. 评估与可视化 ======
# 分类准确率
y1_pred = clf.predict(X_test)
print(f"[Classification] Accuracy: {accuracy_score(y1_test, y1_pred):.4f}")

# 回归指标
y2_pred = stacking_reg.predict(X_test_aug)
mse = mean_squared_error(y2_test, y2_pred)
rmse = np.sqrt(mse)
mae = mean_absolute_error(y2_test, y2_pred)
r2 = r2_score(y2_test, y2_pred)
print("\nRegression Evaluation:")
print(f"- MSE: {mse:.4f}")
print(f"- RMSE: {rmse:.4f}")
print(f"- MAE: {mae:.4f}")
print(f"- R²: {r2:.4f}")


# ====== 5. 持久化（保存）预处理器与模型 ======
dump(scaler, "backend/analysis/detect_model/step0_scaler.joblib")
dump(clf, "backend/analysis/detect_model/step1_classifier.joblib")
dump(stacking_reg, "backend/analysis/detect_model/step2_stacking_regressor.joblib")
