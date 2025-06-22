import {useForm} from 'react-hook-form';
import {loginRequest} from '../api/auth.js'
function LogInModal({ isOpen, onClose, onSwitchToRegister }) {
  if (!isOpen) return null
  const {register,handleSubmit} = useForm();
  const handleOverlayClick = (e) => {
    if (e.target.className === "modal-overlay") {
      onClose()
    }
  }
  

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal">
        <form className="auth-form" onSubmit={handleSubmit(async (values) => {
            console.log(values);
            const res = await loginRequest(values);
            console.log(res)
        })}>
          <div className="form-group">
            <label htmlFor="login-email">Email</label>
            <input type="email" {...register("email",{required:true})} id="login-email" placeholder="Value"/>
          </div>
          <div className="form-group">
            <label htmlFor="login-password">Contraseña</label>
            <input type="password" {...register("password",{required:true})} id="login-password" placeholder="Value"/>
          </div>
          <button type="submit" className="submit-btn">
            Iniciar sesión
          </button>
          <p className="switch-auth">
            ¿No tienes una cuenta?{" "}
            <button type="button" className="link-btn" onClick={onSwitchToRegister}>
              Crear una aquí
            </button>
          </p>
        </form>
      </div>
    </div>
  )
}

export default LogInModal
