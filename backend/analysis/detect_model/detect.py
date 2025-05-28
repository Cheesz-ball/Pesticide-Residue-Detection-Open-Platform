import numpy as np
import pandas as pd
from joblib import load


def check_OOD(X_input, ood_stats, mahalanobis_threshold):
    center = ood_stats["center"]
    cov = ood_stats["cov"]
    cov_inv = np.linalg.pinv(cov)  # 防止协方差不可逆

    ood_flags = []
    mds = []
    minmax_flags = []
    for i, row in enumerate(X_input):
        # 马氏距离
        diff = row - center
        md = np.sqrt(diff @ cov_inv @ diff.T)
        mds.append(md)
        ood_flags.append(md > mahalanobis_threshold)
    return np.array(ood_flags), mds, np.array(minmax_flags)


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
    X_new = test_data.values
    X_new_scaled = scaler.transform(X_new)
    ood_flags, mds, minmax_flags = check_OOD(
        X_new_scaled, ood_stats, mahalanobis_threshold=mahalanobis_threshold
    )

    # 分类器预测（类别和概率）
    y1_proba_new = clf.predict_proba(X_new_scaled)
    y1_pred_new = clf.predict(X_new_scaled).astype(object)
    # 获取最高概率作为可信度
    confidence = np.max(y1_proba_new, axis=1)
    # 堆叠预测
    X_new_aug = np.hstack([X_new_scaled, y1_proba_new])
    y2_pred_new = stacking_reg.predict(X_new_aug)

    # 针对分布外样本赋值
    for i, ood in enumerate(ood_flags):
        if ood:
            y1_pred_new[i] = "unknown"
            confidence[i] = 0.0
            y2_pred_new[i] = np.nan

    # 打印信息
    for i, (ood, md) in enumerate(zip(ood_flags, mds)):
        if ood:
            print(f"Sample {i}: OOD detected! (mahalanobis={md:.2f})")
        else:
            print(f"Sample {i}: In-distribution (mahalanobis={md:.2f})")
    return {
        "classifier_prediction": y1_pred_new.tolist(),
        "classifier_confidence": confidence.tolist(),
        "stacking_prediction": y2_pred_new.tolist(),
        "all_class_probabilities": y1_proba_new.tolist(),
        "mahalanobis_distance": np.array(mds).tolist(),
        "ood_flag": np.array(ood_flags).tolist(),
    }
