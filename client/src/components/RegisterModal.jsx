import {useForm} from 'react-hook-form';
import {registerRequest} from '../api/auth.js'
import { useNavigate } from 'react-router-dom';

function RegisterModal({ isOpen, onClose, onSwitchToLogIn }) {
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
            const res = await registerRequest(values);
            alert(res.data.message)
            if (res.status == 200){
              irAHome()
            }
          }catch(e){
            alert(e.response.data.message)
          }
            

        })}>
          <div className="form-group">
            <label htmlFor="register-email">Email</label>
            <input type="email" {...register("email",{required:true})} id="register-email" placeholder="Value" />
          </div>
          <div className="form-group">
            <label htmlFor="register-username">Username</label>
            <input type="text" {...register("username",{required:true})} id="register-username" placeholder="Value" required />
          </div>
          <div className="form-group">
            <label htmlFor="register-password">Contraseña</label>
            <input type="password" {...register("password",{required:true})} id="register-password" placeholder="Value" required />
          </div>
          <button type="submit" className="submit-btn">
            Registrarse
          </button>
          <p className="switch-auth">
            ¿Ya tienes una cuenta?{" "}
            <button type="button" className="link-btn" onClick={onSwitchToLogIn}>
              Inicia Sesión Aquí
            </button>
          </p>
        </form>
      </div>
    </div>
  )
}

export default RegisterModal
