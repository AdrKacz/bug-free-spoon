export default function _() {
    return (
        <div className="container">
            <h2>Bug Free Spoon</h2>
            <div>
                <a
                href={`${process.env.REACT_APP_API_URL}/auth/google/authorize`}
                rel="noreferrer"
                >
                <button>Sign in with Google</button>
                </a>
            </div>
          </div>
      );
}
