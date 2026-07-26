import json
import re
from pathlib import Path

import numpy as np
import pandas as pd
import tensorflow as tf
from sklearn.model_selection import train_test_split

BASE_DIR = Path(__file__).parent
EXCEL_PATH = BASE_DIR / "interests.xlsx"
OUT_DIR = BASE_DIR / "tfjs_numeric_interest_model"
OUT_DIR.mkdir(exist_ok=True)

CATEGORY_COLUMNS = [
    "sports",
    "tech",
    "creatives",
    "games",
    "innovation",
    "lifestyle",
    "business",
    "science",
]

MAX_LEN = 8
OOV_ID = 1

def normalise(text):
    return re.sub(r"\s+", " ", str(text).lower()).strip()

def tokenize(text):
    return re.findall(r"[a-z0-9]+", normalise(text))

df = pd.read_excel(EXCEL_PATH)
df["Interest"] = df["Interest"].map(normalise)

vocab = {}
next_id = 2

for interest in df["Interest"]:
    for token in tokenize(interest):
        if token not in vocab:
            vocab[token] = next_id
            next_id += 1

def encode(text):
    ids = [vocab.get(token, OOV_ID) for token in tokenize(text)]
    ids = ids[:MAX_LEN]
    ids += [0] * (MAX_LEN - len(ids))
    return ids

X = np.array([encode(text) for text in df["Interest"]], dtype=np.int32)
y = df[CATEGORY_COLUMNS].astype("float32").values

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42,
)

model = tf.keras.Sequential([
    tf.keras.layers.Input(shape=(MAX_LEN,), dtype="int32", name="token_ids"),
    tf.keras.layers.Embedding(input_dim=len(vocab) + 2, output_dim=32, mask_zero=True),
    tf.keras.layers.GlobalAveragePooling1D(),
    tf.keras.layers.Dense(64, activation="relu"),
    tf.keras.layers.Dropout(0.2),
    tf.keras.layers.Dense(len(CATEGORY_COLUMNS), activation="sigmoid"),
])

model.compile(
    optimizer="adam",
    loss="binary_crossentropy",
    metrics=["binary_accuracy"],
)

model.fit(
    X_train,
    y_train,
    validation_data=(X_test, y_test),
    epochs=80,
    batch_size=16,
    callbacks=[
        tf.keras.callbacks.EarlyStopping(
            monitor="val_loss",
            patience=8,
            restore_best_weights=True,
        )
    ],
)

loss, acc = model.evaluate(X_test, y_test)
print(f"Test binary accuracy: {acc:.4f}")

model.save(OUT_DIR / "interest_model.h5")

with open(OUT_DIR / "vocab.json", "w") as f:
    json.dump(vocab, f, indent=2)

with open(OUT_DIR / "category_labels.json", "w") as f:
    json.dump(CATEGORY_COLUMNS, f, indent=2)

print(f"Saved model files to {OUT_DIR}")