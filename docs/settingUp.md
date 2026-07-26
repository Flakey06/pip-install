Steps:
1.
npm install

2.
Add service account key for terminal database scripts
make sure this is never commited

3.
run the following snippet in terminal exactly for the code to run properly when testing the model

py -3.10 -m venv .venv-tfjs-318
.\.venv-tfjs-318\Scripts\Activate.ps1

python -m pip install --upgrade pip setuptools wheel
python -m pip install tensorflowjs==3.18.0 tensorflow==2.10.1 tensorflow-hub numpy==1.23.5 pandas scikit-learn openpyxl packaging==20.9

4.
if converting the trained model again, run the following in terminal

tensorflowjs_converter `
  --input_format=keras `
  --output_format=tfjs_layers_model `
  "interest sorting algo (not integrated)\tfjs_numeric_interest_model\interest_model.h5" `
  "public\models\interest-classifier"

