import numpy as np
import pandas as pd
from joblib import load


def check_OOD(X_input, ood_stats, mahalanobis_threshold):
    center = ood_stats["center"]
    cov = ood_stats["cov"]
    cov_inv = np.linalg.pinv(cov)  # 防止协方差不可逆

    ood_flags = []
    mds = []
    for i, row in enumerate(X_input):
        # 马氏距离
        diff = row - center
        md = np.sqrt(diff @ cov_inv @ diff.T)
        mds.append(md)
        ood_flags.append(md > mahalanobis_threshold)
    return np.array(ood_flags), mds


import numpy as np
from joblib import load


def predict_with_stacking(
    test_data,
    scaler_path,
    clf_path,
    stacking_reg_path,
    ood_stats_path,
    mahalanobis_threshold=70,
):
    scaler = load(scaler_path)
    clf = load(clf_path)
    stacking_reg = load(stacking_reg_path)
    ood_stats = load(ood_stats_path)
    # 数据预处理
    X_new = np.array(test_data).reshape(1, -1)
    X_new_scaled = scaler.transform(X_new)
    ood_flags, mds = check_OOD(
        X_new_scaled, ood_stats, mahalanobis_threshold=mahalanobis_threshold
    )
    # 分类器预测（类别和概率）
    y1_proba_new = clf.predict_proba(X_new_scaled)
    y1_pred_new = clf.predict(X_new_scaled).astype(object)
    # 获取最高概率作为可信度
    confidence = np.round(np.max(y1_proba_new, axis=1) * 100, 2)
    # 堆叠预测
    X_new_aug = np.hstack([X_new_scaled, y1_proba_new])
    y2_pred_new = abs(np.round(stacking_reg.predict(X_new_aug), 2))
    # 针对分布外样本赋值
    for i, ood in enumerate(ood_flags):
        if ood:
            y1_pred_new[i] = "unknown"
            confidence[i] = 100
            y2_pred_new[i] = 0.0
    # 检测结果
    test_result = [
        "阴性 (未检出农药残留)" if pred == "unknown" else "阳性 (检出农药残留)"
        for pred in y1_pred_new
    ]
    # 打印信息
    return {
        "classifier_prediction": y1_pred_new.tolist(),
        "classifier_confidence": confidence.tolist(),
        "stacking_prediction": y2_pred_new.tolist(),
        "all_class_probabilities": y1_proba_new.tolist(),
        "mahalanobis_distance": np.array(mds).tolist(),
        "ood_flag": np.array(ood_flags).tolist(),
        "test_result": test_result,
    }
