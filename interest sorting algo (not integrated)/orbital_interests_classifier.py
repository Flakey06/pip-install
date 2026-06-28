import os
os.environ["TF_USE_LEGACY_KERAS"] = "1"

import tensorflow as tf
import tensorflow_hub as hub
import tensorflow_text as text
import tf_keras as keras
import pandas as pd
import json
import joblib
from sklearn.model_selection import train_test_split
from datetime import datetime
from pathlib import Path

##set up
df = pd.read_excel("interests.xlsx")

Interests = df["Interest"]
category_names =[
        "sports",
        "tech",
        "creatives",
        "games",
        "innovation",
        "lifestyle",
        "business",
        "science"
        ]
categories= df[category_names]


Training_interests, Testing_interests, Training_categories, Testing_categories = train_test_split(
    Interests,
    categories,
    test_size=0.2,
    random_state=42
)


##BERT layering
text_input = keras.layers.Input(shape=(), dtype=tf.string, name="text")

bert_preprocess = hub.KerasLayer(
    "https://tfhub.dev/tensorflow/bert_en_uncased_preprocess/3",
    name="preprocessing"
)

encoder_inputs = bert_preprocess(text_input)

bert_encoder = hub.KerasLayer(
    "https://tfhub.dev/tensorflow/small_bert/bert_en_uncased_L-4_H-512_A-8/2",
    trainable=True,
    name="BERT_encoder"
)

encoder_outputs = bert_encoder(encoder_inputs)

##Modelling
text_input = tf.keras.layers.Input(
    shape=(),
    dtype=tf.string,
    name="text"
)

preprocessed_text = bert_preprocess(text_input)

bert_outputs = bert_encoder(preprocessed_text)

pool = bert_outputs["pooled_output"]

drop_out = tf.keras.layers.Dropout(0.1)(pool)

initial_dense_layer = tf.keras.layers.Dense(128,activation="relu")(drop_out)

categorised_output = tf.keras.layers.Dense(8, activation="sigmoid")(initial_dense_layer)

classifier_model = tf.keras.Model(inputs=text_input, outputs=categorised_output)

classifier_model.compile(optimizer="adam",
              loss="binary_crossentropy",
              metrics=["binary_accuracy"])

classifier_model.summary()

##Training

early_stopping = keras.callbacks.EarlyStopping(
    monitor="val_loss",
    patience=3,
    restore_best_weights=True
)

history = classifier_model.fit(
    Training_interests,
    Training_categories,
    validation_data=(Testing_interests,Testing_categories),
    epochs=20,
    batch_size=32,
    callbacks=[early_stopping]
)

##Evaluation

loss, acc = classifier_model.evaluate(
    Testing_interests,
    Testing_categories)

print(f"Test Accuracy: {acc:.4f}")

##Exporting admin

Model_registry_dir = Path("orbital_classifier_models")
Metadata_path = Model_registry_dir / "best_model_metadata.json"

Model_registry_dir.mkdir(exist_ok=True)

best_accuracy = -1

if Metadata_path.exists():
    with open(Metadata_path, "r") as f:
        metadata = json.load(f)
        best_accuracy = metadata.get("best_accuracy", -1)

if acc > best_accuracy:
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    model_dir = Model_registry_dir / f"orbital_classifier_model_acc-{acc:.4f}_{timestamp}"
    labels_path = model_dir / "category_labels.json"


    classifier_model.save(model_dir)

    with open(labels_path, "w") as f:
        json.dump(category_names, f)

    metadata = {
        "best_accuracy": float(acc),
        "best_model_dir": str(model_dir),
        "category_labels_path": str(labels_path),
        "saved_at": timestamp,
    }

    with open(Metadata_path, "w") as f:
        json.dump(metadata, f, indent=4)

    print(f"New best model saved: {model_dir}")
    print(f"Accuracy improved from {best_accuracy:.4f} to {acc:.4f}")
else:
    print(f"Model not saved. Current accuracy {acc:.4f} did not beat best accuracy {best_accuracy:.4f}.")
