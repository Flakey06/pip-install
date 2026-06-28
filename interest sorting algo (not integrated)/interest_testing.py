import os
os.environ["TF_USE_LEGACY_KERAS"] = "1"

import argparse
import json
import tensorflow as tf
import tensorflow_hub as hub
import tensorflow_text as text
import tf_keras as keras

parser = argparse.ArgumentParser()
parser.add_argument("text", type=str, help="Interest text to classify")
parser.add_argument("--threshold", type=float, default=0.45)
args = parser.parse_args()

model = keras.models.load_model(
    "orbital_classifier_model_acc-0.9012_20260627_031522",
    custom_objects={"KerasLayer": hub.KerasLayer}
)

with open("best_model_metadata.json", "r") as f:
    category_names = json.load(f)

scores = model.predict(tf.constant([args.text]))[0]

matches = [
    (category, float(score))
    for category, score in zip(category_names, scores)
    if score >= args.threshold
]

ranked = sorted(
    zip(category_names, scores),
    key=lambda item: item[1],
    reverse=True
)

print(f"Text: {args.text}")

if matches:
    print("Predicted categories:")
    for category, score in sorted(matches, key=lambda item: item[1], reverse=True):
        print(f"- {category}: {score:.4f}")
else:
    print("No category passed the threshold.")
    print("Top guesses:")
    for category, score in ranked[:3]:
        print(f"- {category}: {float(score):.4f}")
