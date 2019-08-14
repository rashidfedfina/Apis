from flask_wtf import FlaskForm
from wtforms import TextField, IntegerField, TextAreaField, SubmitField, RadioField, SelectField, PasswordField

from wtforms import validators, ValidationError

class LoginForm(FlaskForm):
   #Username Text Field
   username = TextField("Username",[validators.Required("Please enter your username.")])
   #Password Text Field
   Password = PasswordField("Password",[validators.Required("Please enter  your password.")])
   #Login Button
   submit = SubmitField("Login")