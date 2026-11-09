package guardian

func ProductionMutationAllowed(action Action) bool {
	switch action {
	case ActionFailover:
		return false

	case ActionPromote:
		return false

	case ActionRecover:
		return false

	default:
		return true
	}
}
