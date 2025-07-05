import {useForm} from 'react-hook-form';
import {loginRequest, setToken} from '../api/auth.js'
import { useNavigate } from 'react-router-dom';
function LogInModal({ isOpen, onClose, onSwitchToRegister }) {
  if (!isOpen) return null
  const navigate = useNavigate();
  const {register,handleSubmit} = useForm();
  const handleOverlayClick = (e) => {
    if (e.target.className === "modal-overlay") {
      onClose()
    }
  }
  const irAHome = () => {
    navigate('/home');
  };
  

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal">
        <form className="auth-form" onSubmit={handleSubmit(async (values) => {
          try{
            const res = await loginRequest(values);
            alert(res.data.message)
            if (res.status == 200){
              // El token ya viene en las cookies HTTP del backend
              // Pero también podemos guardarlo en cookies del cliente como respaldo
              if (res.data.token) {
                setToken(res.data.token)
              }
              irAHome()
            }
          }catch(e){
            alert(e.response?.data?.message || 'Error al iniciar sesión')
          }
            
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
